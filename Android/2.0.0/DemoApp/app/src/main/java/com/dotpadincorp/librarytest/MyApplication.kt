package com.dotpadincorp.librarytest

import android.app.Application
import android.content.Context

class MyApplication : Application() {

    init{
        instance = this
    }

    companion object {
        lateinit var instance: MyApplication
        fun applicationContext() : Context {
            return instance.applicationContext
        }
    }

    override fun onCreate() {
        super.onCreate()
    }
}