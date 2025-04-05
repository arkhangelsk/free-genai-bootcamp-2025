from db.schema import init_db
from db.seeds.study_activities import seed_study_activities
from db.seeds.words import seed_words
from db.seeds.groups import seed_groups

if __name__ == "__main__":
    # init_db()
    seed_study_activities()
    # seed_words()
    # seed_groups()
