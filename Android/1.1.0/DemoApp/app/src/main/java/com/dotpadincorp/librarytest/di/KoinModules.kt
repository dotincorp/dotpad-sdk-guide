package com.dotpadincorp.librarytest.di

import com.dotpadincorp.ble.BleRepository
import com.dotpadincorp.librarytest.MyApplication
import com.dotpadincorp.librarytest.viewmodel.SubViewModel
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val viewModelModule = module {
    viewModel { SubViewModel(get()) }
}

val repositoryModule = module{
    single{
        BleRepository(MyApplication.instance)
    }
}