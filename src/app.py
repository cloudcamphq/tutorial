import os
import os.path
from flask import Flask, send_from_directory, render_template
from urllib.parse import urlparse
import psycopg2

conn = None
if os.environ.get("DATABASE_URL"):
  url = urlparse(os.environ["DATABASE_URL"])

  conn = psycopg2.connect(
      database = url.path.strip("/"),
      user = url.username,
      password = url.password,
      host = url.hostname,
      port = url.port
  )

curdir = os.path.dirname(os.path.realpath(__file__))
imgdir = os.path.join(curdir, "..", "static", "img")
tpldir = os.path.join(curdir, "..", "templates")

app = Flask(__name__, template_folder=tpldir)

@app.route("/")
def index():
  return render_template("index.html", visits_count=visits_count())

@app.route("/img/logo.svg")
def logo_svg():
  return send_from_directory(imgdir, "logo.svg")

@app.route("/error")
def error():
  raise Exception("Boom!")

def visits_count():
  if not conn:
    return None

  cur = conn.cursor()
  try:
    cur.execute("CREATE TABLE IF NOT EXISTS visits_counter AS SELECT 0 as visits_count;")
    cur.execute("UPDATE visits_counter SET visits_count = visits_count + 1;")
    cur.execute("SELECT visits_count FROM visits_counter;")
    return cur.fetchone()[0]
  finally:
    cur.close()