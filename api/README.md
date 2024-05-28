## Micronaut 3.9.0 Documentation

- [User Guide](https://docs.micronaut.io/3.9.0/guide/index.html)
- [API Reference](https://docs.micronaut.io/3.9.0/api/index.html)
- [Configuration Reference](https://docs.micronaut.io/3.9.0/guide/configurationreference.html)
- [Micronaut Guides](https://guides.micronaut.io/index.html)
---

- [Shadow Gradle Plugin](https://plugins.gradle.org/plugin/com.github.johnrengelman.shadow)
- [Micronaut Gradle Plugin documentation](https://micronaut-projects.github.io/micronaut-gradle-plugin/latest/)
- [GraalVM Gradle Plugin documentation](https://graalvm.github.io/native-build-tools/latest/gradle-plugin.html)
## Feature http-client documentation

- [Micronaut HTTP Client documentation](https://docs.micronaut.io/latest/guide/index.html#httpClient)

## Build the API
```console
./gradlew build
```

## Build a Docker Image of the API
```console
# as a prerequisite, install and run docker
./gradlew build
docker build -t <image_name>:<image_tag> ./
```

Where `image_name` is the name of the image and `image_tag` is a tag assigned to the image.


## Build and Run via Docker
```console
# as a prerequisite, install and run docker
./gradlew build

docker build -t micronaut-api:latest ./

docker run -p 8080:8080 --name micronaut-api micronaut-api:latest

# call the API via `curl`
curl localhost:8080/health -v
```
