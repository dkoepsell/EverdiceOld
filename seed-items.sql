-- Check if items already exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM items LIMIT 1) THEN
        RAISE NOTICE 'Items already exist in the database. Skipping seeding.';
        RETURN;
    END IF;

    -- Insert sample D&D items
    INSERT INTO items (name, description, type, rarity, value, properties, required_level, equip_slot, is_consumable, weight, created_at)
    VALUES
    ('Longsword', 'A versatile one-handed slashing weapon. Can be wielded with two hands for additional damage.', 
     'weapon', 'common', 1500, 
     '{"damage": "1d8 (1d10 two-handed)", "damageType": "slashing", "weight": "3 lb", "properties": "Versatile"}', 
     1, 'mainHand', false, 30, NOW()),
     
    ('Leather Armor', 'A set of light armor made from treated animal hide that provides basic protection.', 
     'armor', 'common', 1000, 
     '{"armorClass": "11 + Dex modifier", "stealthDisadvantage": false, "weight": "10 lb", "category": "Light Armor"}', 
     1, 'body', false, 100, NOW()),
     
    ('Healing Potion', 'A red liquid that restores 2d4+2 hit points when consumed.', 
     'potion', 'common', 5000, 
     '{"healing": "2d4+2", "uses": 1}', 
     1, NULL, true, 5, NOW()),
     
    ('Greater Healing Potion', 'A deep red liquid that restores 4d4+4 hit points when consumed.', 
     'potion', 'uncommon', 10000, 
     '{"healing": "4d4+4", "uses": 1}', 
     3, NULL, true, 5, NOW()),
     
    ('Adventurer''s Pack', 'A backpack containing essential adventuring gear.', 
     'gear', 'common', 1200, 
     '{"contents": ["Backpack", "Bedroll", "Mess kit", "Tinderbox", "10 torches", "10 days of rations", "Waterskin", "50 feet of hempen rope"]}', 
     1, NULL, false, 380, NOW()),
     
    ('Rope, Hempen (50 feet)', 'A sturdy rope made of hemp fiber. Has 2 hit points and can be burst with a DC 17 Strength check.', 
     'gear', 'common', 100, 
     '{"length": "50 feet", "strength": "DC 17 to break", "hitPoints": 2}', 
     1, NULL, false, 100, NOW()),
     
    ('Wand of Magic Missiles', 'A wand that allows the wielder to cast Magic Missile without expending a spell slot.', 
     'wand', 'uncommon', 25000, 
     '{"charges": 7, "recharge": "1d6+1 charges at dawn", "spell": "Magic Missile (1st level)", "higherLevel": "Can expend additional charges to cast at higher levels"}', 
     5, 'offHand', false, 10, NOW()),
     
    ('Chain Mail', 'Heavy armor made of interlocking metal rings. Offers good protection at the cost of stealth.', 
     'armor', 'uncommon', 7500, 
     '{"armorClass": "16", "stealthDisadvantage": true, "strengthRequired": 13, "weight": "55 lb", "category": "Heavy Armor"}', 
     1, 'body', false, 550, NOW()),
     
    ('Shortbow', 'A small bow optimized for use on foot or horseback.', 
     'weapon', 'common', 2500, 
     '{"damage": "1d6", "damageType": "piercing", "range": "80/320", "weight": "2 lb", "properties": "Ammunition, Two-Handed"}', 
     1, 'mainHand', false, 20, NOW()),
     
    ('20 Arrows', 'Arrows for a bow.', 
     'gear', 'common', 100, 
     '{"quantity": 20, "weight": "1 lb"}', 
     1, NULL, true, 10, NOW());
     
    RAISE NOTICE 'Successfully added 10 sample D&D items to the database.';
END
$$;