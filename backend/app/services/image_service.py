from PIL import Image


def images_to_pdf(image_paths: list[str], output_path: str):
    images = []
    for p in image_paths:
        img = Image.open(p).convert("RGB")
        images.append(img)
    if images:
        images[0].save(output_path, save_all=True, append_images=images[1:])
