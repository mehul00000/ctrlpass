-- CtrlPass Initial Development Seed
-- Run after 0001_ctrlpass_schema.sql and 0002_checkin_entry_window.sql

INSERT INTO public.venues
    (id, name, address_line, city, state, pincode, latitude, longitude, maps_reference)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'The Grand Ballroom',
        '100 Silicon Blvd',
        'Bengaluru',
        'Karnataka',
        '560001',
        12.9716,
        77.5946,
        NULL
    )
ON CONFLICT (id) DO NOTHING;
