#!/usr/bin/env python3
"""Verify/extract the original ZIP without ever replacing existing files.

Preserves every source path, including ignored build outputs. Produces an exact
directory tree and SHA-256 manifest for audit of the imported version.
"""
import hashlib
import json
import pathlib
import stat
import sys
import zipfile

SOURCE=pathlib.Path("imports/facturacao-produtos/artifacts-2.zip")
TARGET=pathlib.Path("modules/gestao-facturacao-produtos/versao-artifacts-2")

def render_tree(files):
    root={}
    for item in files:
        path=pathlib.PurePosixPath(item.filename.rstrip("/"))
        node=root
        for component in path.parts[:-1]:
            node=node.setdefault(component,{})
            if node is None:
                raise ValueError("File/directory collision: "+item.filename)
        leaf=path.parts[-1]
        if item.is_dir():
            current=node.get(leaf,{})
            if current is None:
                raise ValueError("File/directory collision: "+item.filename)
            node[leaf]=current
        else:
            if leaf in node:
                raise ValueError("Duplicate or colliding file: "+item.filename)
            node[leaf]=None
    lines=[]
    def walk(children,prefix=""):
        items=sorted(children.items(),key=lambda t:(t[1] is None,t[0].casefold()))
        for i,(name,sub) in enumerate(items):
            last=i==len(items)-1
            lines.append(prefix+("└── " if last else "├── ")+name+("/" if sub is not None else ""))
            if sub is not None:
                walk(sub,prefix+("    " if last else "│   "))
    walk(root)
    return "\n".join(lines)+"\n"

def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(str(SOURCE))
    archive_sha=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    with zipfile.ZipFile(SOURCE) as archive:
        members=archive.infolist()
        files=[item for item in members if not item.is_dir()]
        if not files or len(files)>2000 or sum(x.file_size for x in files)>150_000_000:
            raise ValueError("Unsafe archive size or file count")
        seen=set()
        for item in members:
            path=pathlib.PurePosixPath(item.filename.rstrip("/"))
            if not item.filename.startswith("artifacts/") or path.is_absolute() or ".." in path.parts or "\\" in item.filename:
                raise ValueError("Invalid ZIP path: "+item.filename)
            if item.filename in seen or not path.parts:
                raise ValueError("Duplicate or empty ZIP path: "+item.filename)
            if stat.S_ISLNK(item.external_attr>>16):
                raise ValueError("Archive symlink not allowed: "+item.filename)
            seen.add(item.filename)
        display_tree=render_tree(members)
        TARGET.mkdir(parents=True,exist_ok=True)
        manifest=[]
        for member in files:
            destination=TARGET/member.filename
            if destination.is_symlink():
                raise ValueError("Symlink destination is forbidden: "+str(destination))
            destination.parent.mkdir(parents=True,exist_ok=True)
            for folder in [destination.parent,*destination.parent.parents]:
                if folder==TARGET.parent:
                    break
                if folder.is_symlink():
                    raise ValueError("Symlink folder is forbidden: "+str(folder))
            digest=hashlib.sha256()
            if destination.exists():
                if not destination.is_file() or destination.stat().st_size!=member.file_size:
                    raise ValueError("Existing file differs from original ZIP: "+str(destination))
                with destination.open("rb") as stream:
                    for block in iter(lambda:stream.read(65536),b""):
                        digest.update(block)
                with archive.open(member) as stream:
                    original=hashlib.sha256()
                    for block in iter(lambda:stream.read(65536),b""):
                        original.update(block)
                if digest.hexdigest()!=original.hexdigest():
                    raise ValueError("Refusing to overwrite an existing file: "+str(destination))
            else:
                with archive.open(member) as source,destination.open("xb") as output:
                    for block in iter(lambda:source.read(65536),b""):
                        digest.update(block)
                        output.write(block)
            manifest.append({"file":member.filename,"bytes":member.file_size,"sha256":digest.hexdigest()})
        manifest_file=TARGET/"IMPORT_MANIFEST.json"
        result={
            "source":str(SOURCE),"source_sha256":archive_sha,
            "file_count":len(manifest),"files":manifest,
            "note":"Original directory paths preserved. No production integration."
        }
        if manifest_file.is_file():
            old=json.loads(manifest_file.read_text(encoding="utf-8"))
            if old!=result:
                raise ValueError("Manifest conflict: source ZIP does not match existing version")
        else:
            manifest_file.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        tree_file=TARGET/"TREE.md"
        tree_file.write_text(
            "# Árvore original — Gestão e Facturação de Produtos\n\n"
            "Importação isolada, sem substituir os módulos do ERP. "
            "Os nomes de pastas e ficheiros são exactamente os do ZIP.\n\n"
            f"- **Fonte:** `{SOURCE}`\n"
            f"- **SHA-256 do ZIP:** `{archive_sha}`\n"
            f"- **Ficheiros:** {len(files)}\n"
            f"- **Directórios (incluindo raiz):** {len(members)-len(files)}\n\n"
            "```text\n"+display_tree+"```\n",
            encoding="utf-8"
        )
        (TARGET/"TREE.txt").write_text(
            f"artifacts-2.zip | {len(files)} ficheiros | SHA256 {archive_sha}\n"
            +display_tree,encoding="utf-8"
        )
        print(f"Verified/extracted {len(files)} files; tree contains {len(members)} ZIP entries.")
        print(f"Trees at {TARGET/'TREE.md'} and {TARGET/'TREE.txt'}")

if __name__=="__main__":
    try:
        main()
    except Exception as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
