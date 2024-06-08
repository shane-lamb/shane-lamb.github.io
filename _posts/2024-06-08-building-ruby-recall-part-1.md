---
layout: post
title: Building a flashcard app in Ruby - Part 1
date: 2024-06-08
---

## Goal

I'm a seasoned generalist software developer with limited Ruby experience.
I wanted to build a Ruby application in an effort to familiarise myself with the language, and discover what it has to offer in terms of productivity gains and developer satisfaction.

### What to build?
I decided to build a console application to practice flash cards, which I'm calling "Ruby Recall". There are two main reasons for this choice:
- It's a simple concept, making it easier to implement.
- It has practical use, in that I can use it for language learning. This should help motivate me.

## Getting started

Since I'm a Jetbrains guy, I begin by creating a new Ruby project in IntelliJ... done.

Ok, time to write some code. But since we are now in the age of AI, I'll prompt an LLM instead and see what comes out:

`write a minimal Ruby console application, that allows a user to practice (predefined in code) flashcards`

Amazingly, though I'm currently on a plane without internet access, a local model (the newly released Llama 3 Instruct) running on my MacBook Air produces the following code:

```ruby
# Define the flashcards as an array of hashes
flashcards = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "Who wrote Romeo and Juliet?", answer: "William Shakespeare" },
  { question: "What is the largest planet in our solar system?", answer: "Jupiter" }
]

# Initialize the current flashcard index
current_card_index = 0

# Main loop
while true do
  # Display the current flashcard
  puts "\n#{flashcards[current_card_index][:question]}"

  # Get user input (answer)
  print "Enter your answer: "
  user_answer = gets.chomp.downcase

  # Check if the user's answer is correct
  if user_answer == flashcards[current_card_index][:answer].downcase
    puts "\n Correct! 🎉"
  else
    puts "\n Incorrect. The correct answer is #{flashcards[current_card_index][:answer]}."
  end

  # Ask if the user wants to continue
  print "Continue? (y/n): "
  response = gets.chomp.downcase
  if response == 'n'
    break
  end

  # Move on to the next flashcard
  current_card_index += 1
  if current_card_index >= flashcards.size
    current_card_index = 0
  end
end

puts "\nPractice complete! 👋"
```

I then paste this code to new file named `app.rb` and run it. It works! It's simplistic, but functional.
Not a bad starting point!

## Adding persistent storage

The flash cards are currently defined in code, and this is the first thing I want to change.
I want to store the questions and answers in a database which can be modified independently of the code
and not cleared when the application exits.
Why?
- It's necessary to make the app portable/distributable/usable by others.
- We'll soon want to update metadata on each flashcard. For example, the answer history should determine the frequency that a card is presented, and it should be skipped if it's already been answered recently.

Ruby on Rails is a very popular framework within the Ruby ecosystem. It provides many components geared towards building a relational-database-backed REST-based web server/application.
We may be building a console application, but part of Rails is a gem/library called `ActiveRecord`, which is very relevant as it will provide us a robust, industry standard ORM interface to our application database.

So, `ActiveRecord` becomes our first dependency. I proceed to `bundle init`, add `gem 'activerecord', '~> 7.1'` to the Gemfile and `bundle install`.

ActiveRecord provides the interface, but it's up to us to decide what the backing database engine will be. I could use PostgreSQL, but since this is a local application and to keep things super simple, I'm going to use SQLite, which means the whole database is contained within a single file on my system, and it doesn't require running a separate server process to host it.

Now, I want to create a table to store the flashcard data. This is typically handled by running "migrations" against the database.

### Integrating ActiveRecord into a non-Rails project

Things are complicated since we're using ActiveRecord without Rails, so we can't leverage all the bootstrapped functionality that Rails provides out-of-the-box.
Usually, in a fresh Rails project, we'd have an assortment of `rake` commands available to us to create and run migrations.

To bring parity with Rails and add the missing commands, I did the following:
1. Added `rake` as a dependency in the Gemfile.

2. Created a `Rakefile` in the root of the project with the following code:
```ruby
require "active_record"

# This task is invoked to set up the DB environment/connection,
# as a dependency for tasks that need to interact with the DB
task :environment do
  # Setup code shared between the app and rake tasks to initialise the DB and migrator
  require_relative "db/init"
end

# Load all the tasks provided by the ActiveRecord gem
load "active_record/railties/databases.rake"

# The ActiveRecord gem doesn't provide a task to generate/create new migration files.
# Therefore, this is a hand-rolled task that generates migrations similarly to vanilla Rails.
namespace :g do
  desc "Generate migration"
  task :migration do
    name = ARGV[1] || raise("Specify name: rake g:migration your_migration")
    timestamp = Time.now.strftime("%Y%m%d%H%M%S")
    path = File.expand_path("../db/migrate/#{timestamp}_#{name}.rb", __FILE__)
    migration_class = name.split("_").map(&:capitalize).join

    File.write(path, <<~EOF)
      class #{migration_class} < ActiveRecord::Migration[7.1]
        def change
        end
      end
    EOF

    puts "Migration #{path} created"
    abort # needed stop other tasks
  end
end
```

3. Created a `db` folder in the root of the project using the Rails convention (has a `migrations` subfolder for migrations).

4. Created a `db/init.rb` file to initialise the database connection and migrator. This code is used by the application as well:

```ruby
require "active_record"

env = "development"
root_dir = File.expand_path("..", __dir__)
db_dir = __dir__
all_db_configs = YAML.safe_load_file(File.join(db_dir, "config.yml"))
db_config = all_db_configs[env]

# get database connection
ActiveRecord::Base.establish_connection(db_config)

# set up database tasks (migrations)
include ActiveRecord::Tasks
DatabaseTasks.root = root_dir
DatabaseTasks.env = env
DatabaseTasks.db_dir = db_dir
DatabaseTasks.database_configuration = all_db_configs
DatabaseTasks.migrations_paths = File.join(db_dir, "migrate")
```
The environment is hardcoded to `development` as we currently have no use for multiple environments.

5. Created a `db/config.yml` file to store the database config (very simple):
```yaml
development:
  adapter: sqlite3
  database: storage/development.sqlite3
```

### Doing our first migration

Now that we have `rake` commands available to manage migrations, I created a migration for the flashcards table using `rake g:migration create_flashcards`, which generate an empty file in the migrations folder, which I then filled with:
```ruby
class CreateFlashcards < ActiveRecord::Migration[7.1]
  def change
    create_table :flashcards do |t|
      t.string :front
      t.string :back

      t.timestamps
    end
  end
end
```
The model is simple, a flashcard has a front (question) and a back (answer).

## Updating the app code to use the database

I first created a seed script to populate the database with the same questions and answers that were previously hard-coded:
```ruby
require_relative "../db/init"
require_relative "models/flashcard"

flashcards = [
  { front: "What is the capital of France?", back: "Paris" },
  { front: "Who wrote Romeo and Juliet?", back: "William Shakespeare" },
  { front: "What is the largest planet in our solar system?", back: "Jupiter" }
]
Flashcard.create!(flashcards)
```

Then I needed to update the LLM generated code to read the flashcards from the database:
```ruby
require "active_record"
require_relative "models/flashcard"

require_relative "../db/init"

flashcards = Flashcard.all.load

...
```

That's it! The app functions exactly the same as originally, but with a shiny new database backend. We can now build on this to add more functionality.

While the code is fully working, one thing that I haven't figured out is how to get code completion for the fields of my ActiveRecord models in IntelliJ. This works in a regular Rails project, so hopefully I can figure that out.

The full code is available on my GitHub at https://github.com/shane-lamb/ruby-recall. Stay tuned for further updates!
