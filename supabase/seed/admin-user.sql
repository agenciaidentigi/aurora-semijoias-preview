-- Execute somente em ambiente novo. Troque e-mail e senha antes de usar em producao.
-- E-mail inicial: admin@aurora.local
-- Senha inicial: Troque-Esta-Senha-123!
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@aurora.local', crypt('Troque-Esta-Senha-123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Administrador Aurora"}') on conflict (id) do nothing;
insert into public.profiles (id, email, full_name, role, is_active) values ('00000000-0000-0000-0000-000000000001', 'admin@aurora.local', 'Administrador Aurora', 'admin', true) on conflict (id) do update set role = 'admin', is_active = true;