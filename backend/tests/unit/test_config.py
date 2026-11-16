from app.core.config import Settings


def test_cors_origins_are_split_from_comma_separated_string() -> None:
    settings = Settings(cors_origins="http://localhost:5173, http://localhost:8080")

    assert settings.cors_origins == [
        "http://localhost:5173",
        "http://localhost:8080",
    ]


def test_empty_cors_origins_become_empty_list() -> None:
    settings = Settings(cors_origins="")

    assert settings.cors_origins == []
