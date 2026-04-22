import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from collections import Counter

# Configurazione
NUM_CELLE = 80
FILENAME = "Controllo_Codici_80.xlsx"

# Creazione del workbook
wb = Workbook()
ws = wb.active
ws.title = "Controllo Codici"

# Stili
header_fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
header_font = Font(bold=True, color="FFFFFF")
duplicate_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid") # Rosso chiaro
duplicate_font = Font(color="9C0006") # Rosso scuro
neutral_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
border_style = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
center_alignment = Alignment(horizontal='center', vertical='center')

# Intestazioni
ws['A1'] = "N° Riga"
ws['B1'] = "CODICE DA INSERIRE"
ws['C1'] = "STATO"

# Applica stile intestazioni
for cell in ['A1', 'B1', 'C1']:
    ws[cell].fill = header_fill
    ws[cell].font = header_font
    ws[cell].alignment = center_alignment
    ws[cell].border = border_style

# Generazione righe 1-80
for i in range(1, NUM_CELLE + 1):
    row = i + 1  # Excel row (start from 2)
    
    # Colonna A: Numerazione
    ws[f'A{row}'] = i
    ws[f'A{row}'].alignment = center_alignment
    ws[f'A{row}'].border = border_style
    
    # Colonna B: Cella vuota per inserimento (l'utente scriverà qui)
    ws[f'B{row}'].border = border_style
    
    # Colonna C: Stato (inizialmente vuoto, si aggiornerà con formule o VBA, 
    # ma qui impostiamo la larghezza)
    ws[f'C{row}'] = ""
    ws[f'C{row}'].border = border_style

# Impostazione larghezza colonne
ws.column_dimensions['A'].width = 10
ws.column_dimensions['B'].width = 25
ws.column_dimensions['C'].width = 15

# --- SEZIONE RIASSUNTIVA ---
summary_start_row = NUM_CELLE + 4
ws[f'A{summary_start_row}'] = "RIEPILOGO TOTALI"
ws[f'A{summary_start_row}'].font = Font(bold=True, size=14)

ws[f'A{summary_start_row+1}'] = "Codice"
ws[f'B{summary_start_row+1}'] = "Nr Totali"
ws[f'A{summary_start_row+1}'].font = Font(bold=True)
ws[f'B{summary_start_row+1}'].font = Font(bold=True)

# Nota per l'utente
note_row = summary_start_row - 2
ws[f'A{note_row}'] = "Nota: I duplicati verranno evidenziati in rosso automaticamente."
ws[f'A{note_row}'].font = Font(italic=True, color="FF0000")

# Salvataggio iniziale
wb.save(FILENAME)
print(f"File '{FILENAME}' creato con successo!")
print("Apri il file e inserisci i codici nella colonna B.")
