import pyperclip
import json

with open("paths.txt") as f:
	paths = f.read()

with open("regions.txt") as f:
	regions = json.load(f)

result = "export let paths = new Map(["
for val in paths.split("<path")[1:]:
	id = val.split('id="')[1].split('"')[0]
	path = val.split(' d="')[1].split('"')[0]
	entry = f'["{id}", "{path}"],'
	result += entry
result = result[:-1]
result+="]);"

result += "export let regions = new Map(["
for colour in regions["groups"]:
	label = regions["groups"][colour]["label"]
	for path in regions["groups"][colour]["paths"]:
		result += f'["{path}",{{colour: "{colour}", name: "{label}"}}],'
result = result[:-1]
result+="]);"
pyperclip.copy(result)

with open("./../src/countries.ts", "w") as f:
	f.write(result)
