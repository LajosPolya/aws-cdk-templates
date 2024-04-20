package com.github.lajospolya.controller

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import kotlin.concurrent.thread
import kotlin.math.sqrt

@Controller
class MaxCpuController {

    companion object {
        private const val NUM_THREADS = 4
    }

    /**
     * This method attempts to max out the CPU by spawning threads and calculating the square root of each
     * number spanning from the min value of Long to the max value Long.
     *
     * The purpose of this method is to utilize a high percentage of the CPU such that it triggers the
     * Auto-Scaling Group of this app's deployment (if one exists) to provision another instance/task.
     */
    @Get("/max-cpu")
    fun maxCpu(): HttpResponse<Unit> {

        for(i in 0..NUM_THREADS) {
            threadForSquareRootOfAllLongs()
        }

        return HttpResponse.accepted()
    }

    private fun threadForSquareRootOfAllLongs() = thread {
        for(i in Long.MIN_VALUE..Long.MAX_VALUE) {
            sqrt(i.toDouble())
        }
    }

}