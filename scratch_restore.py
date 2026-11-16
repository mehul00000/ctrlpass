import json, glob, os, re

brains = [
    'C:/Users/sharm/.gemini/antigravity-ide/brain/5bf2c87a-9b15-4bff-a0ce-c539add65302/.system_generated/logs/transcript_full.jsonl',
    'C:/Users/sharm/.gemini/antigravity-ide/brain/068c084f-48fe-4f37-ba3a-3c4d91618bdd/.system_generated/logs/transcript_full.jsonl',
    'C:/Users/sharm/.gemini/antigravity-ide/brain/55089030-6bba-4f57-9fdd-ae4f14db74ec/.system_generated/logs/transcript_full.jsonl',
    'C:/Users/sharm/.gemini/antigravity-ide/brain/831f68d1-ae78-4d49-83b6-2c31aac1b6d7/.system_generated/logs/transcript_full.jsonl'
]

files = {}

for b in brains:
    if not os.path.exists(b):
        continue
    with open(b, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if not ('view_file' in line or 'write_to_file' in line or 'Showing lines' in line or 'replace_file_content' in line):
                continue
            try:
                obj = json.loads(line)
                calls = obj.get('tool_calls', [])
                for c in calls:
                    name = c.get('tool_name', c.get('name', ''))
                    args = c.get('arguments', c.get('args', {}))
                    if isinstance(args, str):
                        try: args = json.loads(args)
                        except: pass
                    if isinstance(args, dict):
                        if name == 'write_to_file' and 'CodeContent' in args:
                            path = args.get('TargetFile')
                            if path:
                                files[path.replace('\\', '/').lower()] = (path, args['CodeContent'])
                content = obj.get('content', '')
                if 'File Path: `' in content and 'Showing lines 1 to ' in content and 'The above content shows the entire, complete file contents' in content:
                    parts = content.split('File Path: `file:///')
                    if len(parts) > 1:
                        fp = parts[1].split('`')[0].strip()
                        code_lines = []
                        capture = False
                        for cl in content.splitlines():
                            if 'The following code has been modified' in cl:
                                capture = True
                                continue
                            if 'The above content' in cl:
                                capture = False
                                continue
                            if capture:
                                if re.match(r'^\d+: ', cl):
                                    code_lines.append(cl.split(': ', 1)[1])
                                elif re.match(r'^\d+:', cl):
                                    code_lines.append('')
                                else:
                                    code_lines.append(cl)
                        if code_lines:
                            files[fp.replace('\\', '/').lower()] = (fp, '\n'.join(code_lines))
            except:
                pass

print(f"Total files captured: {len(files)}")

BASE = 'C:/Users/sharm/Downloads/buildapp'

for k, (orig_path, content) in files.items():
    norm_path = orig_path.replace('\\', '/')
    
    # Check if this is a docs file
    if '/docs/' in norm_path and norm_path.endswith('.md'):
        filename = os.path.basename(norm_path)
        dest = os.path.join(BASE, 'docs', filename)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'w', encoding='utf-8') as out:
            out.write(content)
        print(f"Restored doc: {dest}")
        
    # Check if this is a mobile file
    if ('ytreactnative' in norm_path or 'apps/mobile' in norm_path) and not ('organizer' in norm_path or 'admin' in norm_path or 'mockdata' in norm_path):
        # Extract relative path after ytreactnative/ or apps/mobile/
        rel = None
        if 'ytreactnative/' in norm_path:
            rel = norm_path.split('ytreactnative/')[1]
        elif 'apps/mobile/' in norm_path:
            rel = norm_path.split('apps/mobile/')[1]
            
        if rel and not rel.startswith('supabase/'):
            dest = os.path.join(BASE, 'apps', 'mobile', rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'w', encoding='utf-8') as out:
                out.write(content)
            print(f"Restored mobile: {dest}")

print("Done restoring files.")
