# How to View the Contents of an SQLite Database?

You can access and view the contents of an SQLite database using the `sqlite3` command-line tool or a GUI application. Let's explore both options.

## **1. Using SQLite CLI (Command Line Interface)**
If you have SQLite installed, you can use the following steps:

### **Open the SQLite database**
```bash
sqlite3 your_database.db
```

<img width="615" alt="image" src="https://github.com/user-attachments/assets/d2fcc6f0-eeb8-42c0-8953-c63794eaa29b" />

### **List all tables**
```sql
.tables
```
<img width="495" alt="image" src="https://github.com/user-attachments/assets/e39e0651-a9d9-4f56-93a7-3bbdf9ca27c2" />

### **View the structure of a specific table**
```sql
.schema table_name
```
<img width="451" alt="image" src="https://github.com/user-attachments/assets/f3b503fa-f0cd-48b4-9088-658207b03dae" />

### **View all records from a table**
```sql
SELECT * FROM table_name;
```
<img width="808" alt="image" src="https://github.com/user-attachments/assets/28e666f6-ccc5-44bb-bf35-953b1993449c" />

### **Exit SQLite**
```sql
.exit
```

### **SQLite Help Command**
```
.help
```
<img width="585" alt="image" src="https://github.com/user-attachments/assets/b3d73701-ea42-4066-9557-b0a5ed801656" />

---

## **2. Using a GUI Tool**
If you prefer a graphical interface, you can use tools like:
- **DB Browser for SQLite** (Free and open-source)
- **DBeaver** (Free, Supports multiple databases)
- **SQLiteStudio** (Free and open-source)

### **Viewing SQLite Database Using DB Browser for SQLite**  

DB Browser for SQLite is a free, user-friendly tool for managing SQLite databases. Follow these steps to view your database contents:

#### **1. Download and Install DB Browser for SQLite**  
- Download it from the official site: [https://sqlitebrowser.org/dl/](https://sqlitebrowser.org/dl/)  
- Install it based on your operating system (Windows, macOS, Linux).

#### **2. Open Your SQLite Database**  
- Launch **DB Browser for SQLite**.  
- Click **"Open Database"** and select your `.db` file.  

#### **3. Browse Tables and Data**  
- Go to the **"Browse Data"** tab.  
- Select a table from the dropdown list to view its contents.

<img width="1494" alt="image" src="https://github.com/user-attachments/assets/484a8254-4084-4334-ae5a-83c61cdd7c50" />

<img width="774" alt="image" src="https://github.com/user-attachments/assets/f32d1928-b6b8-4da8-ace8-040f33744f97" />


#### **4. Run SQL Queries (Optional)**  
- Switch to the **"Execute SQL"** tab.  
- Enter SQL commands like:
  ```sql
  SELECT * FROM table_name;
  ```
- Click **"Run"** to execute and see the results.  

<img width="772" alt="image" src="https://github.com/user-attachments/assets/c1e33687-db4f-4ce2-915b-976916b21a88" />

#### **5. Export Data (Optional)**  
- To export table data, go to **"File" > "Export"**, and choose CSV, JSON, or SQL format.  

#### **6. Close the Database**  
- Once done, click **"Close Database"** or exit the application.  

---

### **Viewing an SQLite Database Using DBeaver**  

DBeaver is a powerful database management tool that supports SQLite. Follow these steps to open and explore your SQLite database in DBeaver.  

---

### **1. Install DBeaver**  
- Download DBeaver Community Version from the official site: [https://dbeaver.io/download/](https://dbeaver.io/download/)  
- Install it based on your operating system (Windows, macOS, Linux).  
- Open DBeaver after installation.  

---

### **2. Create a New SQLite Connection**  
- Click **"Database" > "New Database Connection"** (or use `Ctrl + N`).  
- In the **"Select a database"** window, search for **SQLite** and select it.  
- Click **"Next"**.
  
<img width="1046" alt="image" src="https://github.com/user-attachments/assets/60be4cb8-5ac2-4011-9957-f2e2ac8eab4d" />

---

### **3. Select Your SQLite Database File**  
- Click **"Open..."** and select your `.db` file.  
- Ensure the **"Driver settings"** are correct (DBeaver may prompt you to download an SQLite driver).  
- Click **"Finish"** to establish the connection.

<img width="651" alt="image" src="https://github.com/user-attachments/assets/700bba22-0735-44e0-bfe2-a60aaa79650c" />

---

### **4. View Tables and Data**  
- Expand the database connection in the left **Database Navigator** panel.  
- Click on **"Tables"** to see the list of tables.  
- Right-click on a table and select **"View Data"** to browse records.

<img width="376" alt="image" src="https://github.com/user-attachments/assets/d4a29fc2-afb2-4d0c-b8f5-d8fdb0f76089" />

---

### **5. Run SQL Queries**  
- Click **"SQL Editor" > "New SQL Script"** (`Ctrl + Alt + L`).  
- Enter queries like:
  ```sql
  SELECT * FROM table_name;
  ```
- Click **"Execute"** (`Ctrl + Enter`) to run the query and view results.  

<img width="1480" alt="image" src="https://github.com/user-attachments/assets/e98bf137-becf-407a-83a5-41a246015ea0" />

---

### **6. Export Data (Optional)**  
- Right-click on a table, go to **"Export Data"**, and choose CSV, JSON, or SQL format.  
- Follow the export wizard instructions.  

---

### **7. Close the Connection**  
- Right-click the database connection and select **"Disconnect"** when finished.  

### **Viewing an SQLite Database Using SQLiteStudio** 

### **1. Install SQLiteStudio**  
- Download SQLiteStudio from the official website (https://sqlitestudio.pl/) 
- Install it based on your operating system (Windows, macOS, Linux).  
- Open SQLiteStudio after installation.  

---

### **2. Create a New SQLite Connection**  
- Click **"Database" > "Add a database" or use `Ctrl+O`
- Choose your database file or create a new one:
  - Select existing file: Browse to your .db or .sqlite file
  - Create new: Specify location and name with .db extension
- Click "Test connection" to verify
- Click "OK" to complete
  
<img width="966" alt="image" src="https://github.com/user-attachments/assets/d2282a6e-5a3f-4dd7-9b03-9afa8db7f72e" />

---

### **3. View Tables and Data**  
- Expand the database connection in the left **Database Navigator** panel.  
- Click on **"Tables"** to see the list of tables.  
- Right-click on a table and select **"Generate query for table"** and then "SELECT" to write a select query.
- Click on the Run icon.

<img width="963" alt="image" src="https://github.com/user-attachments/assets/f9c40459-a4d3-4081-8426-ff8d27c0a862" />

<img width="966" alt="image" src="https://github.com/user-attachments/assets/3f2fc626-0530-4bd3-a919-89ca30a7ed09" />

### **4.Writing Queries**
- Click "Tools" → "Open SQL Editor" or press F6
- Write your SQL query
- Execute with F9 or green play button
- Results appear in bottom pane

<img width="664" alt="image" src="https://github.com/user-attachments/assets/b0c2dfcc-4ee7-48f7-9994-cb0d9f548968" />

<img width="738" alt="image" src="https://github.com/user-attachments/assets/1dc937c7-18fb-4138-a3b8-a4145f9389d9" />

---

## **3. Using Python**
If you want to access sqlite database using Python, you can use the `sqlite3` module:

```python
import sqlite3

conn = sqlite3.connect("your_database.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM table_name")
rows = cursor.fetchall()

for row in rows:
    print(row)

conn.close()
```

