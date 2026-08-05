package com.dotincorp.demoappnew.ui.screens.pop


import android.util.Log
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

// ✅ AlertDialog 화면
@Composable
fun LanguageGradeSelectDialog(
    showDialog: Boolean,
    langGradeMap: Map<String, List<String>>,
    onDismiss: () -> Unit,
    onConfirm: (String, String?) -> Unit
) {
    if (!showDialog) return

    var selectedLanguage by remember { mutableStateOf<String?>(null) }
    var selectedGrade by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("언어 및 Grade 선택") },
        confirmButton = { 
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("취소") }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 480.dp)
            ) {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(langGradeMap.keys.toList()) { lang ->
                        val grades = langGradeMap[lang] ?: emptyList()
                        val isSelected = selectedLanguage == lang

                        // ✅ 언어 항목
                        Surface(
                            color = if (isSelected)
                                MaterialTheme.colorScheme.primaryContainer
                            else
                                MaterialTheme.colorScheme.surfaceVariant,
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedLanguage = lang
                                    if (grades.isEmpty()) {
                                        onConfirm(selectedLanguage!!, null)
                                    }
                                    selectedGrade = null
                                }
                        ) {
                            Text(
                                text = lang,
                                modifier = Modifier.padding(12.dp),
                                color = if (isSelected)
                                    MaterialTheme.colorScheme.onPrimaryContainer
                                else
                                    MaterialTheme.colorScheme.onSurface
                            )
                        }

                        // ✅ 해당 언어의 Grade 목록
                        if (isSelected && grades.isNotEmpty()) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(start = 16.dp, top = 6.dp, bottom = 8.dp)
                            ) {
                                grades.forEach { grade ->
                                    FilterChip(
                                        selected = selectedGrade == grade,
                                        onClick = {
                                            selectedGrade = grade

                                            onConfirm(selectedLanguage!!, selectedGrade)
                                        },
                                        label = { Text(grade) }
                                    )
                                }
                            }
                        }

                        Divider()
                    }
                }
            }
        }
    )
}
