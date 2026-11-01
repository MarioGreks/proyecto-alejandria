from database import db_conn
from clasificador import regenerar_aristas

if __name__ == "__main__":
    print("Iniciando regeneración de enlaces híbridos (solo se añaden aristas nuevas)...")
    print(f"\nSe propusieron {regenerar_aristas(db_conn)} aristas.")
