import json
from math import inf
from scipy.spatial import KDTree
import time


def load_resources():
    """Returns (paths, regions, coastal) as read from resource files"""

    loc = __file__[:-14]

    with open(f"{loc}paths.txt") as f:
        paths = f.read()

    with open(f"{loc}regions.txt") as f:
        regions = json.load(f)

    with open(f"{loc}coastal.txt") as f:
        coastal = json.load(f)

    return (paths, regions, coastal)


def split_paths(paths):
    """Splits the svg data into a list of (id, path)"""

    return [
        (val.split('id="')[1].split('"')[0], val.split(' d="')[1].split('"')[0])
        for val in paths.split("<path")[1:]
    ]


# The command characters in svg
svg_commands = "LMHVlmhvZz"


def parse_svg_float(index, svg):
    """Parses an svg float (can be ended with a second negitive or a second decimal point or a space or a command). Returns the new index."""

    result = ""

    # Check for an initial negative
    if svg[index] == "-":
        result = "-"
        index += 1

    parsed_decimal_point = False

    while (
        index < len(svg)
        and svg[index] != " "
        and not svg[index] in svg_commands
        and svg[index] != "-"
        and (not parsed_decimal_point or svg[index] != ".")
    ):
        result += svg[index]
        if svg[index] == ".":
            parsed_decimal_point = True
        index += 1

    if index < len(svg) and svg[index] == " ":
        index += 1
    if index < len(svg) and svg[index].lower() == "z":
        index += 1
    return (float(result), index)


def parse_svg(svg):
    """Converts an svg to a KDTree and a bounding box"""

    index = 0
    points = []
    current_position = (0, 0)
    bounding_box = (inf, inf, -inf, -inf)

    while index < len(svg):
        # Implicitly use last command if no new command is found
        if svg[index] in svg_commands:
            command = svg[index]
            index += 1

        if command == "L" or command == "M":
            (x, index) = parse_svg_float(index, svg)
            (y, index) = parse_svg_float(index, svg)
            current_position = (x, y)

        elif command == "h":
            (v, index) = parse_svg_float(index, svg)
            current_position = (current_position[0] + v, current_position[1])

        elif command == "v":
            (v, index) = parse_svg_float(index, svg)
            current_position = (current_position[0], current_position[1] + v)

        elif command == "H":
            (v, index) = parse_svg_float(index, svg)
            current_position = (v, current_position[1])

        elif command == "V":
            (v, index) = parse_svg_float(index, svg)
            current_position = (current_position[0], v)

        elif command == "l" or command == "m":
            (x, index) = parse_svg_float(index, svg)
            (y, index) = parse_svg_float(index, svg)
            current_position = (current_position[0] + x, current_position[1] + y)

        points.append(current_position)

        bounding_box = (
            min(bounding_box[0], current_position[0]),
            min(bounding_box[1], current_position[1]),
            max(bounding_box[2], current_position[0]),
            max(bounding_box[3], current_position[1]),
        )

    return (KDTree(points), bounding_box)


def check_bounds_intersect(a, b):
    """Do 2 axis aligned bounding boxes intersect?"""

    (a_left, a_top, a_right, a_bottom) = a
    (b_left, b_top, b_right, b_bottom) = b
    return (
        (a_left < b_right)
        and (a_right > b_left)
        and (a_top < b_bottom)
        and (a_bottom > b_top)
    )


def evaluate_neighbours(points):
    """Calculate neighbours for each province"""

    return [
        [
            a_name,
            [
                b_name
                for (b_name, (b_tree, b_bound)) in points
                if check_bounds_intersect(a_bound, b_bound)
                and not a_name == b_name
                and not all(item == [] for item in b_tree.query_ball_tree(a_tree, 0.5))
            ],
        ]
        for (a_name, (a_tree, a_bound)) in points
    ]


def run():
    print("Loading resources...")
    start = time.time()
    (paths, regions, coastal) = load_resources()
    path_data = split_paths(paths)
    print(f"Done in {time.time() - start:.3f}s\n")

    print("Parsing points...")
    start = time.time()
    points = [(v[0], parse_svg(v[1])) for v in path_data]
    print(f"Done in {time.time() - start:.3f}s\n")

    print("Evaluate neighbours...")
    start = time.time()
    neighbours = evaluate_neighbours(points)
    print(f"Done in {time.time() - start:.3f}s\n")

    print("Evaluating output string...")
    start = time.time()

    result = "export let paths = new Map(["

    for (id, path) in path_data:
        entry = f'["{id}", "{path}"],'
        result += entry
    result = result[:-1]
    result += "]);"

    result += "export let regions = new Map(["
    for colour in regions["groups"]:
        label = regions["groups"][colour]["label"]
        for path in regions["groups"][colour]["paths"]:
            result += f'["{path}",{{colour: "{colour}", name: "{label}"}}],'
    result = result[:-1]
    result += "]);"

    result += f"export let coastal_regions = {coastal};"
    result += f"export let province_neighbours: Map<string, string[]> = new Map({neighbours});"

    print(f"Done in {time.time() - start:.3f}s\n")

    print("Writing to file...")
    start = time.time()

    with open(f"{__file__[:-22]}src/countries.ts", "w") as f:
        f.write(result)

    print(f"Done in {time.time() - start:.3f}s\n")


run()
