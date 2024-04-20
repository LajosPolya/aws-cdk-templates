package com.github.lajospolya.controller

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.client.HttpClient
import io.micronaut.http.uri.UriBuilder
import jakarta.inject.Inject
import java.net.URI

/**
 * This controller commands the server to reach out to another server and return the body of the response.
 *
 * This is extremely insecure and should never be used in production. This was developed purely to test
 * server communication within the same private network.
 */
@Controller
class RelayController {

    @Inject
    private lateinit var client: HttpClient

    @Get("/relay{?host,relayHost,}")
    fun relay(@QueryValue host: String?, @QueryValue relayHost: String?): String {

        val uri = URI.create("http://${host!!}")
        val builder = UriBuilder.of(uri)
        builder.port(8080)
        builder.path("relay-health")
        builder.queryParam("host", relayHost)

        return client.toBlocking().exchange(builder.build().toASCIIString(), String::class.java).body() ?: "null"
    }

    @Get("/relay-health{?host}")
    fun relayHealth(@QueryValue host: String?): String {

        val uri = URI.create("http://${host!!}")
        val builder = UriBuilder.of(uri)
        builder.port(8080)
        builder.path("health")

        return client.toBlocking().exchange(builder.build().toASCIIString(), String::class.java).body() ?: "null"
    }
}