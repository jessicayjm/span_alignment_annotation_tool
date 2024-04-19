# Web tool for span and alignment annotation

This is a website that provides annotation function for spans given one text and one-to-one alignment given two texts with spans. The tool was originally built for our paper: [Modeling Empathetic Alignment in Conversation](). But it can easily be modified to support other tasks that contain spans or alignments.

#### Features

+ Provide span-level annotation function.
+ Provide alignment of spans annotation.
+ Offer Note function where annotators can make private notes on specific segment of text or join shared discussion with other annotators.
+ Add Review function where annotators can have access to others' annotations.
+ Easy job management for project admin and users.
+ Support data upload and download.
+ Built-in calculation for inter-annotator agreement using [pygamma-agreement](https://pygamma-agreement.readthedocs.io/en/latest/).

Here are some **demos** on the website: [Demos](https://drive.google.com/drive/folders/102F-dOkJDQw_OR0Z6WSbGO26-1ccXVNk?usp=drive_link)

#### Installation

(The installation has been tested on Ubuntu 20.04 LTS.)

The website uses Flask, ReactJS, and Sqlite3 . The base architecture refers to EECS 485 at UMich.

** All commands should be executed under base folder `span_alignment_annotation_tool/`.

**Install Utilities**

```
$ sudo apt-get install sqlite3 curl
$ pip install -r requirements.txt
```

Install [Nodejs](https://nodejs.org/en) before running the following command:

```
$ npm ci . --force
```

**Initialize directories**

```
$ ./bin/compAnninit
```

Add files under `sql/uploads` if needed. They will be copied to `var/uploads`.

**Initialize database**

Insert the project admin info to start in `sql/init/sql`. DO NOT insert plain password. You will be able set the password on login page from the website as a first-time user.

```
$ ./bin/compAnndb create
```

General `./bin/compAnndb` usage:

```
Usage: ./bin/compAnndb (create|destroy|reset)
```

*Note: `destroy` command will DELETE the database under `var` and CLEAR `var/uploads/`, but everything under `sql` will not be affected. Use this command with caution.*

**Configure secret keys**

Fill in `SECRET_KEY` and `JWT_SECRET_KEY` (they shall be different) in `compAnn/services/config.py`.

You can choose to use the following command to randomly generate the keys:

```
$ openssl rand -base64 32
```

**Create package**

```
$ pip install -e .
```

**Start the website**

```
$ ./bin/compAnnrun
```

#### Data upload and download

All data files are `json` format.

##### Project upload format

Here is a simple sample of the project upload format

```
{
    "agreement_score": 0,
    "annotators":
    [
        {
            "email": "admin@admin",
            "fullname": "Final Annotation",
            "isAdmin": 0,
            "username": "Final Annotation"
        },
        {
            "email": "admin@email.com",
            "fullname": "Admin",
            "isAdmin": 1,
            "username": "admin"
        },
        {
            "email": "user1@email.com",
            "fullname": "User 1",
            "isAdmin": 0,
            "username": "user1"
        },
        {
            "email": "user2@email.com",
            "fullname": "User 2",
            "isAdmin": 0,
            "username": "user2"
        },
        {
            "email": "output@model",
            "fullname": "Model",
            "isAdmin": 0,
            "username": "Model"
        }
    ],
    "data":
    {
    },
    "description": "description on the project",
    "labels":
    [
        {
            "color": "#E6B0AA",
            "name": "label1"
        },
        {
            "color": "#D7BDE2",
            "name": "label2"
        }
    ],
    "name": "name of the project"
}
```

The format in `data` is the same as *Data upload format* below.

##### Data upload format

###### Upload texts

This specifies the format for uploading only the texts to annotate and their related information.

Create a `Dataframe` with the following fields:

| id   | target_id | observer_id | parent_id | subreddit | target_text | observer_text | distress_score | condolence_score | empathy_score | full_text |
| ---- | --------- | ----------- | --------- | --------- | ----------- | ------------- | -------------- | ---------------- | ------------- | --------- |
| int  | string    | string      | string    | string    | string      | string        | float          | float            | float         | string    |

+ `id`: the id of current instance
+ `target_id` (our project specific): the id of target text from Reddit API
+ `observer_id` (our project specific): the id of observer text from Reddit API
+ `parent_id` (our project specific): the `parent_id` of comment or post from Reddit API
+ `subreddit` (our project specific): Subreddit name
+ `target_text`: target text
+ `observer_text`: observer text
+ `distress_score`: the distress score for target
+ `condolence_score`: the condolence score for observer
+ `empathy_score`: the empathy score for target-observer pair
+ `full_text`: the text to annotation. (our project specific: the combination of `target` and `observer`)

*Note: if applying to other tasks for span annotation, `id`* and `full_text` are sufficient. All other fields can be left empty with only the column name present. 

Convert it to `json` file with to get the desired data upload format.

###### Upload with annotations

This specifies the format for uploading texts and their annotations (spans/alignments)

Create a `Dataframe` with the following fields:

| id   | target_id | observer_id | parent_id | subreddit | target_text | observer_text | distress_score | condolence_score | empathy_score | full_text | annotations                        | annotator1                 | annotator2                 | ...  | alignments                                                   | annotator1_align                                             | annotator2_align                                             | ...  |
| ---- | --------- | ----------- | --------- | --------- | ----------- | ------------- | -------------- | ---------------- | ------------- | --------- | ---------------------------------- | -------------------------- | -------------------------- | ---- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ---- |
| int  | string    | string      | string    | string    | string      | string        | float          | float            | float         | string    | [[email, start, end, label], ... ] | [[start, end, label], ...] | [[start, end, label], ...] |      | [[email, (target_start, target_end), (observer_start, observer_end)], ...] | [[(target_start, target_end), (observer_start, observer_end)], ...] | [[(target_start, target_end), (observer_start, observer_end)], ...] |      |

Newly added fields compared to Upload texts:

+ `annotations`: annotations from all annotators. `label` in the array should be one of the labels specified in *Project upload format*.
+ `annotator?`: the column name should be the email of the annotator (the code will automatically match the email format). The values are the annotations belonged to this specific annotator.
+ `alignments`: alignments from all annotators.
+ `annotator?_align`: the column name should be the email of the annotator with `_align` followed. This is a fixed format used in the code.

##### Data download format

Same as *Project upload format* with ALL information included.

#### Citation

Cite our paper if you use this tool:

#### Contact

If you need any help on the website, please contact: jiaminy@ttic.edu.

