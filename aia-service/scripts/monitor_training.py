"""
Script para monitorear el progreso del fine-tuning y actualizar automáticamente el modelo.
"""
import os
import time
import sys
from dotenv import load_dotenv, set_key
import openai

load_dotenv()

def check_training_status(training_job_id):
    """Verifica el estado del job de fine-tuning."""
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        job = client.fine_tuning.jobs.retrieve(training_job_id)
        return {
            "status": job.status,
            "fine_tuned_model": job.fine_tuned_model,
            "error": job.error if hasattr(job, 'error') else None
        }
    except (openai.OpenAIError, ValueError) as e:
        print(f"❌ Error al verificar el estado: {e}")
        return None

def update_env_file(model_name):
    """Actualiza el archivo .env con el nuevo modelo."""
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    try:
        set_key(env_path, "FINE_TUNED_MODEL", model_name)

        # También guardar en un archivo de texto para referencia
        with open("data/fine_tuned_model.txt", "w", encoding="utf-8") as f:
            f.write(model_name)

        print(f"✅ Archivo .env actualizado con el modelo: {model_name}")
        return True
    except (IOError, OSError) as e:
        print(f"❌ Error al actualizar .env: {e}")
        return False

def monitor_training(training_job_id, check_interval=60):
    """Monitorea el entrenamiento hasta que complete o falle."""
    print(f"🔍 Monitoreando job: {training_job_id}")
    print(f"⏰ Verificando cada {check_interval} segundos...\n")

    while True:
        status_info = check_training_status(training_job_id)

        if not status_info:
            print("❌ No se pudo obtener el estado. Reintentando...")
            time.sleep(check_interval)
            continue

        status = status_info["status"]
        timestamp = time.strftime("%H:%M:%S")

        if status == "validating_files":
            print(f"[{timestamp}] 📋 Validando archivos de entrenamiento...")
        elif status == "queued":
            print(f"[{timestamp}] ⏳ En cola, esperando recursos...")
        elif status == "running":
            print(f"[{timestamp}] 🏃 Entrenando modelo...")
        elif status == "succeeded":
            model_name = status_info["fine_tuned_model"]
            print("\n✅ ¡Entrenamiento completado exitosamente!")
            print(f"📦 Nuevo modelo: {model_name}")

            if update_env_file(model_name):
                print("\n🎉 ¡Todo listo! El modelo ha sido actualizado.")
                print("🔄 Reinicia el servicio de IA para usar el nuevo modelo:")
                print("   cd aia-service")
                print("   python main.py")
            return True
        elif status == "failed":
            error = status_info.get("error", "Error desconocido")
            print(f"\n❌ El entrenamiento falló: {error}")
            return False
        elif status == "cancelled":
            print("\n⚠️ El entrenamiento fue cancelado")
            return False
        else:
            print(f"[{timestamp}] ❓ Estado desconocido: {status}")

        time.sleep(check_interval)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Uso: python monitor_training.py <job_id>")
        print("📝 Ejemplo: python monitor_training.py ftjob-abc123...")
        sys.exit(1)

    job_id = sys.argv[1]
    monitor_training(job_id)
