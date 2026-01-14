"""
Script para subir datos de entrenamiento a OpenAI y crear job de fine-tuning
"""

import os
import sys
import time

import openai
from dotenv import load_dotenv

load_dotenv()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def upload_and_train():
    """Sube el dataset y crea un job de fine-tuning"""

    training_file_path = "data/training_data.jsonl"

    if not os.path.exists(training_file_path):
        print("âŒ Error: No se encontrÃ³ el archivo de entrenamiento")
        print("ðŸ’¡ Ejecuta primero: python scripts/generate_training_data.py")
        return None

    try:
        # 1. Subir archivo de entrenamiento
        print("ðŸ“¤ Subiendo archivo de entrenamiento a OpenAI...")
        with open(training_file_path, "rb") as training_file_handle:
            training_file = client.files.create(
                file=training_file_handle,
                purpose="fine-tune"
            )

        print("âœ… Archivo subido exitosamente")
        print(f"   ID: {training_file.id}")
        print(f"   Nombre: {training_file.filename}")
        print(f"   TamaÃ±o: {training_file.bytes / 1024:.1f} KB")

        # 2. Crear job de fine-tuning
        print("\nðŸ”§ Iniciando job de fine-tuning...")
        print("   Modelo base: gpt-4o-mini-2024-07-18")

        fine_tune_job = client.fine_tuning.jobs.create(
            training_file=training_file.id,
            model="gpt-4o-mini-2024-07-18",
            hyperparameters={
                "n_epochs": 3
            },
            suffix="educonecta-v1"
        )

        print("âœ… Job de fine-tuning creado exitosamente")
        print(f"   Job ID: {fine_tune_job.id}")
        print(f"   Estado: {fine_tune_job.status}")
        print(f"   Modelo destino: {fine_tune_job.model}")

        print("\n⏳ El entrenamiento tomará entre 10-60 minutos")
        print("   dependiendo del tamaño del dataset.")
        url = f"https://platform.openai.com/finetune/{fine_tune_job.id}"
        print(f"👀 Monitorea el progreso en: {url}")
        print("\nðŸ’¡ Para verificar el estado, ejecuta:")
        print(f"   python scripts/upload_training_data.py check {fine_tune_job.id}")

        # Guardar job_id para referencia
        with open("data/last_job_id.txt", "w", encoding="utf-8") as job_file:
            job_file.write(fine_tune_job.id)

        return fine_tune_job.id

    except openai.OpenAIError as e:
        print(f"âŒ Error durante el proceso: {str(e)}")
        return None

def check_job_status(job_id_to_check):
    """Verifica el estado del job de fine-tuning"""
    try:
        print(f"ðŸ” Verificando estado del job: {job_id_to_check}")
        job = client.fine_tuning.jobs.retrieve(job_id_to_check)

        print("\nðŸ“Š Estado del Fine-Tuning:")
        print(f"   Estado: {job.status}")
        print(f"   Modelo: {job.model}")

        if job.status == "succeeded":
            print("\nðŸŽ‰ Â¡Fine-tuning completado exitosamente!")
            print(f"ðŸ“¦ Modelo entrenado: {job.fine_tuned_model}")
            print("\nâš™ï¸ IMPORTANTE: Actualiza tu archivo .env con:")
            print(f"   FINE_TUNED_MODEL={job.fine_tuned_model}")
            print("\nðŸ’¡ Puedes usar este modelo inmediatamente en el servicio IA")

            # Guardar modelo entrenado
            with open("data/fine_tuned_model.txt", "w", encoding="utf-8") as model_file:
                model_file.write(job.fine_tuned_model)

            return job.fine_tuned_model

        if job.status == "failed":
            print("\n❌ El fine-tuning falló")
            if job.error:
                print(f"   Error: {job.error}")

        if job.status in ["validating_files", "queued", "running"]:
            print("\n⏳ El fine-tuning está en progreso...")
            if hasattr(job, 'trained_tokens') and job.trained_tokens:
                print(f"   Tokens procesados: {job.trained_tokens}")
            print("   Verifica nuevamente en unos minutos")

        known_statuses = ["succeeded", "failed", "validating_files", "queued", "running"]
        if job.status not in known_statuses:
            print(f"   Estado no reconocido: {job.status}")

        return None

    except openai.OpenAIError as e:
        print(f"âŒ Error al verificar el estado: {str(e)}")
        return None

def list_fine_tuned_models():
    """Lista todos los modelos fine-tuned disponibles"""
    try:
        print("ðŸ“‹ Listando modelos fine-tuned disponibles...\n")

        jobs = client.fine_tuning.jobs.list(limit=10)

        completed_models = []
        for job in jobs.data:
            if job.status == "succeeded" and job.fine_tuned_model:
                completed_models.append({
                    "model": job.fine_tuned_model,
                    "job_id": job.id,
                    "created_at": job.created_at,
                    "base_model": job.model
                })

        if completed_models:
            print(f"âœ… Encontrados {len(completed_models)} modelos completados:\n")
            for i, model in enumerate(completed_models, 1):
                print(f"{i}. {model['model']}")
                print(f"   Job ID: {model['job_id']}")
                print(f"   Modelo base: {model['base_model']}")
                print(f"   Creado: {time.ctime(model['created_at'])}")
                print()
        else:
            print("âŒ No se encontraron modelos fine-tuned completados")

    except openai.OpenAIError as e:
        print(f"âŒ Error al listar modelos: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "check":
            if len(sys.argv) > 2:
                job_id = sys.argv[2]
            else:
                # Intentar leer del Ãºltimo job guardado
                if os.path.exists("data/last_job_id.txt"):
                    with open("data/last_job_id.txt", "r", encoding="utf-8") as job_id_file:
                        job_id = job_id_file.read().strip()
                    print(f"ðŸ“ Usando Ãºltimo job ID guardado: {job_id}\n")
                else:
                    print("âŒ Error: Proporciona un job_id")
                    print("   Uso: python scripts/upload_training_data.py check <job_id>")
                    sys.exit(1)

            check_job_status(job_id)

        elif command == "list":
            list_fine_tuned_models()

        else:
            print(f"âŒ Comando no reconocido: {command}")
            print("   Comandos disponibles: check, list")

    else:
        # Subir y entrenar
        upload_and_train()
