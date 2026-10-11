from app.database import Base, engine
from app.models import Case


Base.metadata.create_all(bind=engine)

print("RADAR database tables created successfully.")