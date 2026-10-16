import re,html,json,sys
from pathlib import Path
out=[]
for collection,path in [('F2L',sys.argv[1]),('AdvancedF2L',sys.argv[2])]:
 s=Path(path).read_text();blocks=re.split(r'<div class="row singlealgorithm[^>]*data-subgroup="[^"]*" data-alg="([^"]+)"[^>]*>',s)
 cases=[];kept=0
 for i in range(1,len(blocks),2):
  name,body=blocks[i:i+2];cases.append(name)
  panels=re.split(r"<div data-ori='([0-3])'[^>]*>",body)
  for j in range(1,len(panels),2):
   slot=int(panels[j])
   for raw in re.findall(r'<div class="formatted-alg">(.*?)</div>',panels[j+1],re.S):
    alg=' '.join(html.unescape(re.sub('<[^>]+>','',raw)).split()).replace("2'",'2').replace('’',"'")
    if alg and all(re.fullmatch("[URFDLBy](?:2|')?",t) for t in alg.split()):out.append({'case':name,'slot':slot,'alg':alg});kept+=1
 print(collection,len(cases),kept,cases[-5:])
Path(sys.argv[3]).write_text(json.dumps(out))
