#include <cstdint>
#include <optional>

int main() {
    constexpr std::optional<std::int64_t> population{100'000};
    static_assert(population.value() == 100'000);
    return 0;
}
