CREATE TABLE IF NOT EXISTS owners (
	id SERIAL primary key,
	name varchar
);

CREATE TABLE IF NOT EXISTS accounts (
	id SERIAL primary key,
	owner_id integer references owners(id),
	balance money default 0,
	active boolean default true,
	created_at timestamp default current_timestamp,
	updated_at timestamp default current_timestamp
);

CREATE TABLE IF NOT EXISTS records (
	id SERIAL primary key,
	owner_id integer references owners(id),
	account_id integer references accounts(id),
	to_account_id integer references accounts(id),
	amount money,
	created_at timestamp default current_timestamp,
	charge money
);
