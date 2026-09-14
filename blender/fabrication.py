"""
Packshots Luméa — génération et rendu sous Blender.

Construit toute la scène par script (aucun .blend à maintenir), anime les
quatre gestes de la fabrication, puis rend en WebP à fond transparent.

La page /fabrication du site n'utilise PAS ces images : elle anime la bouteille
en 3D temps réel (components/FabricationScene.vue). Ce script sert à produire
des visuels fixes haute définition — fiches produit, presse, réseaux — là où un
rendu hors ligne reste supérieur à ce que fait le navigateur.

    blender -b --factory-startup -P blender/fabrication.py
    blender -b --factory-startup -P blender/fabrication.py -- --frames 180 --flavor nuage
    blender -b --factory-startup -P blender/fabrication.py -- --only 60   (rendu d'essai)

Les bornes des quatre étapes correspondent au tableau BOUNDS de
pages/fabrication.vue : si l'une bouge ici, l'autre doit suivre.
"""

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

# ---------------------------------------------------------------------------
# Paramètres
# ---------------------------------------------------------------------------

# Parfums : même palette que composables/useSite.ts.
FLAVORS = {
    "solaire": {"juice": (1.0, 0.16, 0.0), "cap": (1.0, 0.70, 0.24)},
    "comete": {"juice": (0.92, 0.02, 0.14), "cap": (1.0, 0.48, 0.66)},
    "prairie": {"juice": (0.06, 0.48, 0.14), "cap": (0.62, 0.88, 0.28)},
    "lagon": {"juice": (0.0, 0.46, 0.45), "cap": (0.44, 0.88, 0.83)},
    "nuage": {"juice": (0.20, 0.14, 0.78), "cap": (0.62, 0.56, 1.0)},
    "aurore": {"juice": (1.0, 0.36, 0.0), "cap": (1.0, 0.82, 0.48)},
}

# Profil de la bouteille en coupe : (rayon, hauteur) en mètres. Une 20 cl
# trapue, épaule marquée, col court — le gabarit tenable par une main d'enfant.
PROFILE = [
    (0.0000, 0.000),
    (0.0265, 0.000),
    (0.0300, 0.006),
    (0.0300, 0.150),
    (0.0295, 0.164),
    (0.0250, 0.182),
    (0.0175, 0.198),
    (0.0136, 0.209),
    (0.0136, 0.232),
    (0.0150, 0.236),
    (0.0150, 0.244),
]

BOTTLE_TOP = PROFILE[-1][1]

# Bornes des quatre gestes, en fraction de la séquence.
BOUNDS = {"fruits": (0.00, 0.30), "juice": (0.24, 0.60), "label": (0.56, 0.82), "cap": (0.80, 1.0)}


# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------

def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=None, help="dossier de sortie")
    parser.add_argument("--frames", type=int, default=120)
    parser.add_argument("--flavor", default="solaire", choices=sorted(FLAVORS))
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=1600)
    parser.add_argument("--samples", type=int, default=64)
    parser.add_argument("--only", type=int, default=0, help="rendre une seule frame (essai)")
    return parser.parse_args(argv)


def at(fraction, total):
    """Fraction de séquence → numéro de frame."""
    return max(1, round(fraction * (total - 1)) + 1)


def key(obj, path, frame, value, index=-1, interp="BEZIER"):
    """Pose une clé et fixe son interpolation."""
    if index >= 0:
        getattr(obj, path)[index] = value
    else:
        setattr(obj, path, value)
    obj.keyframe_insert(data_path=path, frame=frame, index=index)
    action = obj.animation_data.action
    # Blender 4.4+ range les courbes dans des « slots » ; on parcourt donc
    # les fcurves via l'API de haut niveau plutôt qu'action.fcurves.
    curves = action.fcurves if hasattr(action, "fcurves") and len(action.fcurves) else []
    if not curves and hasattr(action, "layers"):
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    curves = list(bag.fcurves) + list(curves)
    for curve in curves:
        if curve.data_path != path:
            continue
        for kp in curve.keyframe_points:
            if abs(kp.co.x - frame) < 0.5:
                kp.interpolation = interp
                kp.easing = "EASE_IN_OUT"


def set_inputs(node, values):
    """Affecte des entrées de shader en tolérant les renommages d'API."""
    for names, value in values.items():
        for name in names if isinstance(names, tuple) else (names,):
            if name in node.inputs:
                node.inputs[name].default_value = value
                break


def principled(name, values, refractive=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    set_inputs(node, values)
    if refractive:
        # Sans ces deux drapeaux, EEVEE rend la transmission comme une surface
        # opaque : la bouteille sort grise et le jus disparaît.
        if hasattr(mat, "use_raytrace_refraction"):
            mat.use_raytrace_refraction = True
        if hasattr(mat, "use_screen_refraction"):
            mat.use_screen_refraction = True
        if hasattr(mat, "thickness_mode"):
            mat.thickness_mode = "SLAB"
    return mat


def revolve(name, profile, steps=96):
    """Crée un solide de révolution à partir d'un profil (rayon, z)."""
    mesh = bpy.data.meshes.new(name)
    verts = [(r, 0.0, z) for r, z in profile]
    edges = [(i, i + 1) for i in range(len(verts) - 1)]
    mesh.from_pydata(verts, edges, [])
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    screw = obj.modifiers.new("Screw", "SCREW")
    screw.axis = "Z"
    screw.angle = math.radians(360)
    screw.steps = steps
    screw.render_steps = steps
    screw.use_merge_vertices = True
    screw.use_normal_calculate = True
    return obj


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


# ---------------------------------------------------------------------------
# Construction de la scène
# ---------------------------------------------------------------------------

def build_bottle(colors):
    glass = revolve("Verre", PROFILE)
    solid = glass.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = 0.0022
    solid.offset = -1
    glass.data.materials.append(
        principled(
            "Verre",
            {
                "Base Color": (0.90, 0.96, 0.95, 1.0),
                ("Transmission Weight", "Transmission"): 1.0,
                "Roughness": 0.045,
                "IOR": 1.46,
                "Metallic": 0.0,
                ("Coat Weight", "Clearcoat"): 0.12,
            },
            refractive=True,
        )
    )
    shade_smooth(glass)
    return glass


def build_juice(colors, total):
    """Le jus : un solide plein, coupé par un cube dont la hauteur monte."""
    inner = [(max(r - 0.0032, 0.0), z) for r, z in PROFILE if z <= 0.212]
    juice = revolve("Jus", inner + [(0.0, 0.212)])

    bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0, 0, 0))
    cutter = bpy.context.object
    cutter.name = "NiveauJus"
    cutter.hide_render = True

    boolean = juice.modifiers.new("Niveau", "BOOLEAN")
    boolean.operation = "INTERSECT"
    boolean.object = cutter
    # Blender 5 a renommé les solveurs booléens ; on prend le plus rapide
    # disponible, la découpe étant un simple plan horizontal.
    solvers = [i.identifier for i in type(boolean).bl_rna.properties["solver"].enum_items]
    boolean.solver = "FLOAT" if "FLOAT" in solvers else solvers[0]

    juice.data.materials.append(
        principled(
            "Jus",
            {
                # Le jus reste opaque : dans EEVEE, la réfraction en espace
                # écran ne voit que la géométrie opaque. Un liquide réfractif
                # serait rangé dans la même passe que le verre, qui ne le
                # verrait donc pas du tout — bouteille grise et vide.
                "Base Color": (*colors["juice"], 1.0),
                ("Transmission Weight", "Transmission"): 0.0,
                ("Subsurface Weight", "Subsurface"): 0.0,
                "Roughness": 0.12,
                "IOR": 1.34,
            },
        )
    )
    shade_smooth(juice)

    # Le cube descend sous la bouteille au départ (aucun jus visible), puis
    # remonte jusqu'à noyer le corps : sa face supérieure fait le niveau.
    start, end = BOUNDS["juice"]
    key(cutter, "location", at(start, total), -0.30, index=2)
    key(cutter, "location", at(end, total), 0.192 - 0.30, index=2)
    return juice


def build_label(colors, total):
    """L'étiquette s'enroule : un cylindre révélé face par face (modif. Build)."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=96, radius=0.0307, depth=0.040, end_fill_type="NOTHING", location=(0, 0, 0.062)
    )
    label = bpy.context.object
    label.name = "Etiquette"
    label.data.materials.append(
        principled(
            "Papier",
            {"Base Color": (0.95, 0.95, 0.93, 1.0), "Roughness": 0.85, ("Specular IOR Level", "Specular"): 0.2},
        )
    )

    start, end = BOUNDS["label"]
    build = label.modifiers.new("Enroulement", "BUILD")
    build.frame_start = at(start, total)
    build.frame_duration = at(end, total) - at(start, total)
    build.use_random_order = False

    # Le nom, posé sur l'étiquette et cintré au rayon de la bouteille.
    bpy.ops.object.text_add(location=(0, -0.0315, 0.064))
    text = bpy.context.object
    text.name = "Nom"
    text.data.body = "LUMÉA"
    text.data.align_x = "CENTER"
    text.data.size = 0.0105
    text.data.space_character = 1.2
    text.rotation_euler = (math.radians(90), 0, 0)
    text.data.extrude = 0.0002

    bend = text.modifiers.new("Cintrage", "SIMPLE_DEFORM")
    bend.deform_method = "BEND"
    bend.angle = math.radians(-78)
    bend.deform_axis = "Y"

    ink = principled("Encre", {"Base Color": (*colors["juice"], 1.0), "Roughness": 0.45})
    text.data.materials.append(ink)

    # Le nom n'apparaît qu'une fois l'étiquette presque posée.
    key(text, "scale", at(end - 0.02, total), 0.0, index=0)
    key(text, "scale", at(end - 0.02, total), 0.0, index=1)
    key(text, "scale", at(end - 0.02, total), 0.0, index=2)
    key(text, "scale", at(end + 0.04, total), 1.0, index=0)
    key(text, "scale", at(end + 0.04, total), 1.0, index=1)
    key(text, "scale", at(end + 0.04, total), 1.0, index=2)
    return label


def build_cap(colors, total):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.0168, depth=0.017)
    cap = bpy.context.object
    cap.name = "Capsule"
    bevel = cap.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.0012
    bevel.segments = 3

    metal = principled(
        "Metal",
        {
            "Base Color": (*colors["cap"], 1.0),
            "Metallic": 1.0,
            "Roughness": 0.28,
            "Anisotropic": 0.4,
        },
    )
    cap.data.materials.append(metal)
    shade_smooth(cap)

    start, end = BOUNDS["cap"]
    # La capsule descend en tournant, puis se cale d'un dernier quart de tour.
    key(cap, "location", at(start, total), BOTTLE_TOP + 0.075, index=2)
    key(cap, "location", at(end, total), BOTTLE_TOP - 0.004, index=2)
    key(cap, "rotation_euler", at(start, total), math.radians(720), index=2)
    key(cap, "rotation_euler", at(end, total), 0.0, index=2)
    return cap


def build_fruits(colors, total):
    """Trois fruits tombent dans le goulot et disparaissent en s'y engouffrant."""
    start, end = BOUNDS["fruits"]
    fruits = []
    for i in range(3):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.021)
        fruit = bpy.context.object
        fruit.name = f"Fruit{i + 1}"
        shade_smooth(fruit)

        tint = colors["juice"] if i % 2 == 0 else colors["cap"]
        fruit.data.materials.append(
            principled(
                f"Fruit{i + 1}",
                {
                    "Base Color": (*tint, 1.0),
                    "Roughness": 0.42,
                    ("Subsurface Weight", "Subsurface"): 0.25,
                },
            )
        )

        offset = i * 0.07
        drop_start = at(min(start + offset, end - 0.06), total)
        drop_end = at(min(start + offset + 0.14, end), total)

        fruit.location = ((i - 1) * 0.02, 0, 0.55)
        key(fruit, "location", drop_start, 0.55, index=2)
        key(fruit, "location", drop_end, BOTTLE_TOP + 0.01, index=2, interp="BEZIER")
        key(fruit, "rotation_euler", drop_start, 0.0, index=0)
        key(fruit, "rotation_euler", drop_end, math.radians(160), index=0)
        # Le fruit s'efface en entrant : c'est le jus qui prend le relais.
        key(fruit, "scale", drop_end - 4, 1.0, index=0)
        key(fruit, "scale", drop_end - 4, 1.0, index=1)
        key(fruit, "scale", drop_end - 4, 1.0, index=2)
        key(fruit, "scale", drop_end, 0.0, index=0)
        key(fruit, "scale", drop_end, 0.0, index=1)
        key(fruit, "scale", drop_end, 0.0, index=2)
        fruits.append(fruit)
    return fruits


def shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)


def build_studio():
    """Trois surfaces lumineuses : une clé haute, un remplissage, un contre-jour."""
    # Deux bandeaux verticaux de part et d'autre, plus une nappe de remplissage :
    # ce sont eux qui posent les longs reflets qui font lire le verre comme du
    # verre sur un packshot de jus.
    setups = [
        ("BandeauDroit", (0.32, -0.16, 0.13), (0.09, 0.55), 16),
        ("BandeauGauche", (-0.32, -0.16, 0.13), (0.07, 0.55), 10),
        ("Remplissage", (0.0, -0.55, 0.30), (0.7, 0.7), 9),
        ("ContreJour", (-0.10, 0.45, 0.34), (0.35, 0.35), 6),
    ]
    target = Vector((0, 0, 0.12))
    for name, location, size, power in setups:
        light_data = bpy.data.lights.new(name, type="AREA")
        light_data.shape = "RECTANGLE"
        light_data.size = size[0]
        light_data.size_y = size[1]
        light_data.energy = power
        light = bpy.data.objects.new(name, light_data)
        light.location = location
        bpy.context.collection.objects.link(light)
        direction = target - Vector(location)
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    # Le verre ne réfracte que ce qu'il y a autour : avec un fond transparent,
    # c'est le monde. Un dégradé (clair en haut, sourd en bas) suffit à donner
    # au verre les variations qui le font lire comme du verre plutôt que comme
    # du plastique gris.
    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    tree = world.node_tree
    background = tree.nodes["Background"]
    background.inputs["Strength"].default_value = 0.92

    coord = tree.nodes.new("ShaderNodeTexCoord")
    gradient = tree.nodes.new("ShaderNodeTexGradient")
    gradient.gradient_type = "LINEAR"
    mapping = tree.nodes.new("ShaderNodeMapping")
    mapping.inputs["Rotation"].default_value = (0, math.radians(-90), 0)
    ramp = tree.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.10
    ramp.color_ramp.elements[0].color = (0.80, 0.81, 0.83, 1)
    ramp.color_ramp.elements[1].position = 0.90
    ramp.color_ramp.elements[1].color = (1.0, 0.99, 0.97, 1)

    tree.links.new(coord.outputs["Window"], mapping.inputs["Vector"])
    tree.links.new(mapping.outputs["Vector"], gradient.inputs["Vector"])
    tree.links.new(gradient.outputs["Color"], ramp.inputs["Fac"])
    tree.links.new(ramp.outputs["Color"], background.inputs["Color"])

    bpy.context.scene.world = world


def build_camera():
    camera_data = bpy.data.cameras.new("Camera")
    camera_data.lens = 85
    # Cadrage calé sur la hauteur du capteur (24 mm) : à 1,15 m, le champ
    # vertical fait ~32 cm, soit une bouteille de 24,4 cm sur les trois quarts
    # de l'image, avec de l'air au-dessus pour la chute des fruits.
    camera_data.sensor_fit = "VERTICAL"
    camera = bpy.data.objects.new("Camera", camera_data)
    camera.location = (0.0, -1.15, 0.18)
    bpy.context.collection.objects.link(camera)

    # Caméra strictement fixe : c'est ce qui rend le scrub lisible côté site.
    direction = Vector((0, 0, 0.125)) - Vector(camera.location)
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera
    return camera


# ---------------------------------------------------------------------------
# Rendu
# ---------------------------------------------------------------------------

def configure_render(args, out_dir):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = args.width
    scene.render.resolution_y = args.height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.frame_start = 1
    scene.frame_end = args.frames

    eevee = scene.eevee
    if hasattr(eevee, "taa_render_samples"):
        eevee.taa_render_samples = args.samples
    # Le verre a besoin du lancer de rayons d'EEVEE pour réfracter le jus.
    if hasattr(eevee, "use_raytracing"):
        eevee.use_raytracing = True
    if hasattr(eevee, "use_shadows"):
        eevee.use_shadows = True

    view = scene.view_settings
    if "Standard" in [i.identifier for i in type(view).bl_rna.properties["view_transform"].enum_items]:
        view.view_transform = "Standard"
    view.look = "None"
    view.exposure = 0.0

    image = scene.render.image_settings
    image.file_format = "WEBP"
    image.color_mode = "RGBA"
    image.quality = 88

    os.makedirs(out_dir, exist_ok=True)
    scene.render.filepath = out_dir + os.sep


def main():
    args = parse_args()
    colors = FLAVORS[args.flavor]

    default_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
    out_dir = os.path.abspath(args.out) if args.out else default_out

    clear_scene()
    build_studio()
    build_camera()
    build_bottle(colors)
    build_juice(colors, args.frames)
    build_label(colors, args.frames)
    build_cap(colors, args.frames)
    build_fruits(colors, args.frames)
    configure_render(args, out_dir)

    print(f"[lumea] {args.flavor} · {args.frames} frames · {args.width}x{args.height} → {out_dir}")

    if args.only:
        bpy.context.scene.frame_set(args.only)
        bpy.context.scene.render.filepath = os.path.join(out_dir, f"essai_{args.only:04d}")
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)

    print("[lumea] terminé")


if __name__ == "__main__":
    main()
