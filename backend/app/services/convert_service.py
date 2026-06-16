import os

def pdf_to_docx(pdf_path: str, output_path: str):
    from pdf2docx import Converter
    cv = Converter(pdf_path)
    try:
        cv.convert(output_path, start=0, end=None)
    finally:
        cv.close()


def pdf_to_xlsx(pdf_path: str, output_path: str):
    import pdfplumber
    from openpyxl import Workbook

    wb = Workbook()
    with pdfplumber.open(pdf_path) as pdf:
        first = True
        for i, page in enumerate(pdf.pages):
            sheet_name = f"Page {i + 1}"[:31]
            ws = wb.create_sheet(title=sheet_name) if first or i > 0 else wb.active
            if first:
                ws.title = sheet_name
                first = False

            tables = page.extract_tables()
            if tables:
                for ti, table in enumerate(tables):
                    if ti > 0:
                        ws = wb.create_sheet(title=f"{sheet_name}_t{ti + 1}"[:31])
                    for row_data in table:
                        ws.append(row_data)
            else:
                text = page.extract_text()
                if text:
                    for line in text.strip().split("\n"):
                        ws.append([line])

    if len(wb.sheetnames) == 1 and not any(ws.iter_rows(min_row=1, max_row=1, values_only=True) for ws in wb.worksheets):
        ws = wb.active
        ws.append(["No content extracted from PDF"])

    wb.save(output_path)
