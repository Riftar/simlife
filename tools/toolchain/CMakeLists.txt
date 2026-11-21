cmake_minimum_required(VERSION 3.20)
project(SimLifeToolchain LANGUAGES CXX)

add_executable(simlife_toolchain main.cpp)
set_target_properties(simlife_toolchain PROPERTIES
    CXX_STANDARD 17
    CXX_STANDARD_REQUIRED YES
    CXX_EXTENSIONS NO
)

enable_testing()
add_test(NAME simlife_toolchain COMMAND simlife_toolchain)
