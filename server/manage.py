#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SERVER_DIR))

from users import create_user, get_user


def main():
    parser = argparse.ArgumentParser(description='Management CLI for Fleet API')
    sub = parser.add_subparsers(dest='cmd')

    create = sub.add_parser('create-admin')
    create.add_argument('--email', required=True)
    create.add_argument('--password', required=True)
    create.add_argument('--tenant', required=False, default='default')

    args = parser.parse_args()
    if args.cmd == 'create-admin':
        existing = get_user(args.email)
        if existing:
            print('User already exists')
            return
        user = create_user(args.email, args.password, role='SUPER_ADMIN', tenant=args.tenant)
        print('Created user:', user)


if __name__ == '__main__':
    main()
