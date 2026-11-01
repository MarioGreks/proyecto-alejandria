@echo off
echo [Alejandria] Iniciando infraestructura de Alejandria...

rem Añadir rutas habituales de Ollama al PATH por si no estan registradas globalmente
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Ollama;%USERPROFILE%\AppData\Local\Programs\Ollama;C:\Program Files\Ollama"

echo.
echo [Alejandria] Comprobando entorno virtual aislado (.venv)...
if not exist "backend\.venv" (
    echo Creando nuevo entorno virtual para no ensuciar tu sistema...
    python -m venv backend\.venv
)

echo.
echo [Alejandria] Instalando dependencias de Python...
call backend\.venv\Scripts\activate.bat
python -m pip install -q --disable-pip-version-check -r backend\requirements.txt

echo.
echo [Alejandria] Verificando Motor Logico (Ollama)...
curl -s http://localhost:11434/ > nul 2>&1
if errorlevel 1 (
    echo Arrancando Ollama en segundo plano...
    start "" /B ollama serve > nul 2>&1
) else (
    echo Ollama ya se encuentra en ejecucion.
)

echo.
echo [Alejandria] Iniciando Backend FastAPI...
cd backend
python -m uvicorn main:app --reload
