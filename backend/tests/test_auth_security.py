from decimal import Decimal

from backend.models.budget_management_models import User
from backend.services.auth.auth_models import Auth_login
from backend.services.auth.auth_services import hash_password, login, verify_password


def test_password_hash_round_trip_uses_portable_pbkdf2():
    password_hash = hash_password("correct-password")

    assert password_hash.startswith("pbkdf2_sha256$")
    assert verify_password("correct-password", password_hash)
    assert not verify_password("incorrect-password", password_hash)


def test_login_does_not_return_a_password_hash(session):
    session.add(
        User(
            username="ada",
            name="Ada",
            first_name="Lovelace",
            password=hash_password("correct-password"),
            solde=Decimal("0.00"),
        )
    )
    session.commit()

    result = login(Auth_login(username="ada", password="correct-password"), session)

    assert result["status"] == "success"
    assert "password" not in result["user"]
    assert login(Auth_login(username="ada", password="incorrect"), session) == {"status": "fail"}
