package com.github.lajospolya.controller

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get

@Controller
class HealthController {

    @Get("/health")
    fun health() = HttpResponse.noContent<Unit>()
}