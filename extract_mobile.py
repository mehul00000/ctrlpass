import json, os

LOG = 'C:/Users/sharm/.gemini/antigravity-ide/brain/5bf2c87a-9b15-4bff-a0ce-c539add65302/.system_generated/logs/transcript_full.jsonl'
BASE_MOBILE = 'C:/Users/sharm/Downloads/buildapp/apps/mobile'

# Mapping of file suffixes to destination in apps/mobile
allowed_files = {}

with open(LOG, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if 'write_to_file' not in line and 'replace_file_content' not in line:
            continue
        try:
            obj = json.loads(line)
            for c in obj.get('tool_calls', []):
                tool = c.get('tool_name', c.get('name', ''))
                args = c.get('arguments', c.get('args', {}))
                if isinstance(args, str): args = json.loads(args)
                
                if tool == 'write_to_file':
                    tf = args.get('TargetFile', '')
                    code = args.get('CodeContent', '')
                    if not tf or not code: continue
                    norm = tf.replace('\\', '/')
                    # Ignore organizer and admin and mockData screens
                    if any(x in norm for x in ['/screens/organizer/', '/screens/admin/', 'mockData.ts']):
                        continue
                    
                    if 'YtReactNative/' in norm:
                        rel = norm.split('YtReactNative/')[1]
                        allowed_files[rel] = code
                    elif 'apps/mobile/' in norm:
                        rel = norm.split('apps/mobile/')[1]
                        allowed_files[rel] = code
        except Exception as e:
            pass

print(f"Extracted {len(allowed_files)} mobile files from write_to_file calls.")

for rel, code in allowed_files.items():
    if rel.startswith('supabase/'): continue
    dest = os.path.join(BASE_MOBILE, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as out:
        out.write(code)
    print(f"Wrote {dest}")

print("Extraction complete.")
