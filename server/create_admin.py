import os
import argparse
import getpass

try:
    from argon2 import PasswordHasher
    use_argon2 = True
    ph = PasswordHasher()
except Exception:
    import bcrypt
    use_argon2 = False


def create_hash(password: str) -> str:
    if use_argon2:
        return ph.hash(password)
    else:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def main():
    parser = argparse.ArgumentParser(description='Create admin password hash for .env')
    parser.add_argument('--password', help='Password to hash (if omitted, prompts)')
    args = parser.parse_args()

    pwd = args.password
    if not pwd:
        pwd = getpass.getpass('Admin password: ')
        pwd2 = getpass.getpass('Confirm: ')
        if pwd != pwd2:
            print('Passwords do not match')
            return

    hashed = create_hash(pwd)
    print('\nAdd the following to your .env or CI secret as DEFAULT_ADMIN_PASSWORD_HASH:')
    print(hashed)


if __name__ == '__main__':
    main()
