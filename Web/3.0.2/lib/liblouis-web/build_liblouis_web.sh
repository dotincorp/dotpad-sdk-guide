#!/usr/bin/env bash

# Builds a browser-loadable ES module: liblouis.js + liblouis.wasm +
# liblouis.data. The .data file contains liblouis translation tables and is
# fetched automatically by the generated Emscripten loader.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
UPSTREAM_DIR="${SCRIPT_DIR}/upstream/liblouis"
BUILD_DIR="${SCRIPT_DIR}/build"
INSTALL_DIR="${BUILD_DIR}/install"
OUTPUT_DIR="${SCRIPT_DIR}/output"
TABLES_OVERRIDE_DIR="${REPO_ROOT}/BrailleLibrary/src/tables-override"

UPSTREAM_URL="${UPSTREAM_URL:-https://github.com/liblouis/liblouis.git}"
UPSTREAM_REF="${UPSTREAM_REF:-v3.38.0}"
LIBLOUIS_SRC_REQUEST="${LIBLOUIS_SRC:-git}"
JOBS="${JOBS:-4}"

die() {
  echo "error: $*" >&2
  exit 1
}

for tool in git emconfigure emmake emcc autoconf automake libtool make; do
  command -v "${tool}" >/dev/null 2>&1 || die "${tool} was not found. Activate the Emscripten SDK first."
done

TABLES_OVERRIDE_LIB="${TABLES_OVERRIDE_DIR}/apply.sh"
[[ -f "${TABLES_OVERRIDE_LIB}" ]] || die "table override helper not found: ${TABLES_OVERRIDE_LIB}"
# shellcheck source=../tables-override/apply.sh
source "${TABLES_OVERRIDE_LIB}"

if [[ "${LIBLOUIS_SRC_REQUEST}" == "git" ]]; then
  LIBLOUIS_SRC="${UPSTREAM_DIR}"
  if [[ -d "${LIBLOUIS_SRC}/.git" ]]; then
    git -C "${LIBLOUIS_SRC}" remote set-url origin "${UPSTREAM_URL}"
    git -C "${LIBLOUIS_SRC}" fetch --tags --prune origin
    git -C "${LIBLOUIS_SRC}" reset --hard
    git -C "${LIBLOUIS_SRC}" clean -fd
    git -C "${LIBLOUIS_SRC}" checkout --detach "${UPSTREAM_REF}"
  else
    rm -rf "${LIBLOUIS_SRC}"
    mkdir -p "$(dirname "${LIBLOUIS_SRC}")"
    git clone --depth 1 --branch "${UPSTREAM_REF}" "${UPSTREAM_URL}" "${LIBLOUIS_SRC}"
  fi
else
  LIBLOUIS_SRC="${LIBLOUIS_SRC_REQUEST}"
fi
[[ -d "${LIBLOUIS_SRC}" ]] || die "liblouis source was not found: ${LIBLOUIS_SRC}"

apply_table_overrides

if [[ ! -f "${LIBLOUIS_SRC}/configure" ]]; then
  (cd "${LIBLOUIS_SRC}" && sh ./autogen.sh)
fi

rm -rf "${BUILD_DIR}" "${OUTPUT_DIR}"
mkdir -p "${BUILD_DIR}" "${OUTPUT_DIR}"

(
  cd "${BUILD_DIR}"
  emconfigure "${LIBLOUIS_SRC}/configure" \
    --host=wasm32-unknown-emscripten \
    --prefix="${INSTALL_DIR}" \
    --disable-shared \
    --enable-static

  # Only the core and tables are needed in the browser; tools/tests are not.
  emmake make -C gnulib -j"${JOBS}"
  emmake make -C liblouis -j"${JOBS}"
  emmake make -C liblouis install
  emmake make -C tables install
)

LIBLOUIS_ARCHIVE="${INSTALL_DIR}/lib/liblouis.a"

TABLES_DIR="${INSTALL_DIR}/share/liblouis/tables"
TABLES_BUNDLE_DIR="${BUILD_DIR}/tables-for-web"
[[ -f "${LIBLOUIS_ARCHIVE}" ]] || die "liblouis static archive was not produced."

[[ -d "${TABLES_DIR}" ]] || die "liblouis tables were not installed."

# These upstream tables are LGPLv3+. Do not put them in the browser payload:
# this SDK target distributes only the LGPLv2.1+ table set.
LGPLV3_TABLES=(
  sr-g1.ctb sr-Cyrl.ctb sr-common.cti sr-cyrletters.cti sr-latletters.cti
  pt-pt-g2.ctb Es-Es-G0.utb et-g0.utb is-chardefs6.cti is-chardefs8.cti
)
# These otherwise LGPLv2.1+ aliases include a table above, and would fail at
# runtime if kept in the payload.
TABLES_WITH_EXCLUDED_INCLUDES=(pt.tbl is.tbl grc-international-es.utb)

rm -rf "${TABLES_BUNDLE_DIR}"
mkdir -p "${TABLES_BUNDLE_DIR}"
cp -a "${TABLES_DIR}/." "${TABLES_BUNDLE_DIR}/"
for table in "${LGPLV3_TABLES[@]}" "${TABLES_WITH_EXCLUDED_INCLUDES[@]}"; do
  rm -f "${TABLES_BUNDLE_DIR}/${table}"
done
emcc -O3 --no-entry \
  -I"${INSTALL_DIR}/include/liblouis" \
  "${SCRIPT_DIR}/liblouis_web.c" \
  "${LIBLOUIS_ARCHIVE}" \
  --preload-file "${TABLES_BUNDLE_DIR}@/tables" \
  --post-js "${SCRIPT_DIR}/liblouis.post.js" \
  -sMODULARIZE=1 \
  -sEXPORT_ES6=1 \
  -sEXPORT_NAME=createLiblouis \
  -sENVIRONMENT=web,worker \
  -sFILESYSTEM=1 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sEXPORTED_FUNCTIONS='["_ll_set_data_path","_ll_translate","_ll_last_error"]' \
  -sEXPORTED_RUNTIME_METHODS='["ccall"]' \
  -o "${OUTPUT_DIR}/liblouis.js"

echo "Browser module built:"
find "${OUTPUT_DIR}" -maxdepth 1 -type f -printf '  %f\n' | sort
