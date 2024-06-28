---
layout: post
title: Building a flashcard app in Ruby - Part 2
date: 2024-06-08
---

## Re-assessing

Let's see where we last left off with the flashcard app.
We generated some basic application code with an LLM, and integrated that with a local database.
The app itself simply iterates over all the flashcards in the database, in the same order, showing the front of the card and prompting the user
to type what's on the back of the card. The user then gets feedback on whether they were correct, and if not, what the actual answer was:

![ruby-recall-demo-screenshot](/assets/images/ruby-recall-1.png)

The next feature I'd like to add is spaced repetition, where the app keeps track of our guesses to determine how long to wait until a review of each card is needed. I'd also like to lay the foundation for testing and write our first tests for the app.

## Spaced repetition

There are many algorithms that could be used to implement spaced repetition, but I'm going to start off with a simple one that makes intuitive sense, based on the "Leitner System".

We can imagine that our flashcards are placed into 5 numbered boxes:
- Box 1 (Daily Review): Start with all your flashcards in this box. Review these cards every day.
- Box 2 (Every 3 Days): If you get a card right, move it to Box 2. Review these cards every three days.
- Box 3 (Weekly Review): If you get cards in Box 2 right, move them to Box 3, and so on.
- Box 4 (Every 2 Weeks)
- Box 5 (Monthly)

This box-oriented system was originally designed for physical boxes and cards, but since we are building an electronic system,
we don't need to strictly assign cards to boxes, but instead each card can be separately tracked and scheduled.

Since this will require additional data to be stored on the Flashcard model, we'll start off with a migration.

I started off with creating a new migration:

```ruby
class SupportSpacedRepetition < ActiveRecord::Migration[7.1]
  def change
    add_column :flashcards, :correct_guess_streak, :integer, default: 0
    add_column :flashcards, :review_due_at, :date, default: -> { "CURRENT_TIMESTAMP" }
  end
end
```

But this didn't work as the SQLite adapter has limited support for complex migrations like this. I go the following error:

```shell
SQLite3::SQLException: Cannot add a column with non-constant default
```

Since we are only hacking and there's no consequence to it at this stage, I just modified the original migration to include these additional columns, deleted the database and re-ran the migrations. done!

## Adding tests

I decided to use the standard MiniTest/ActiveSupport Rails test setup since that's the easiest to get started with.

The tests need a little bit of bootstrapping; the database needs to be loaded first. I created a test init file for this purpose:

```ruby
require "minitest/autorun"

require "active_record"
require "active_support/test_case"
ActiveRecord::Base.establish_connection(adapter: 'sqlite3', database: ':memory:')
require_relative "../db/schema"
```

It imports some standard requirements for running tests, and sets up an in-memory database with our schema.

I then proceeded to write some tests and the accompanying code in the Flashcard model to do some basic operations needed for the app:
- Fetch the next card to review (next due card)
- Update the card after a guess is made (correct or incorrect) so it can be scheduled for future review

```ruby
require_relative "../init"

require_relative "../../app/models/flashcard"

class FlashcardTest < ActiveSupport::TestCase
  setup do
    ActiveRecord::Base.connection.begin_transaction(joinable: false)

    freeze_time
    Flashcard.create(front: "1a", back: "1b")
  end

  test "should schedule card immediately after creation" do
    assert_not_nil Flashcard.next_due
  end

  test "should schedule cards progressively further into the future after consecutive correct guesses" do
    # on the first correct guess...
    Flashcard.next_due.schedule_after_correct_guess

    # it schedules review for the next day (T+1)
    travel 1.day - 1.second
    assert_nil Flashcard.next_due
    travel 1.second
    assert_not_nil Flashcard.next_due

    # on the second correct guess...
    Flashcard.next_due.schedule_after_correct_guess

    # it schedules review for T+2
    travel 2.days - 1.second
    assert_nil Flashcard.next_due
    travel 1.second
    assert_not_nil Flashcard.next_due
  end

  ... more tests here ...

  teardown do
    ActiveRecord::Base.connection.rollback_transaction
  end
end
```

And the code added to the existing Flashcard model:

```ruby
class Flashcard < ActiveRecord::Base
  def self.next_due
    self.where("review_due_at <= ?", Time.now).order(:review_due_at).first
  end

  def schedule_after_correct_guess
    self.review_due_at = Time.now + 1.day * (2 ** self.correct_guess_streak)
    self.correct_guess_streak += 1
    self.save
  end

  def schedule_after_incorrect_guess
    self.correct_guess_streak = 0
    self.review_due_at = Time.now + 1.hour
    self.save
  end
end
```

## Updating the application code

Now we can update the application to use the new scheduling features, rather than blindly iterating over all the flashcards in the database:

```ruby
while Flashcard.next_due
  flashcard = Flashcard.next_due

  # Display the current flashcard
  puts "\n#{flashcard.front}"

  # Get user input (answer)
  print "Enter your answer: "
  user_answer = gets.chomp.downcase

  # Check if the user's answer is correct
  if user_answer == flashcard.back.downcase
    puts "\n Correct! 🎉"
    flashcard.schedule_after_correct_guess
  else
    puts "\n Incorrect. The correct answer is #{flashcard.back}."
    flashcard.schedule_after_incorrect_guess
  end

  # Ask if the user wants to continue
  print "Continue? (y/n): "
  response = gets.chomp.downcase
  if response == 'n'
    break
  end
end

puts "\nPractice complete! 👋"
```

Cool! Now the app has a basic spaced repetition system in place.
Only flashcards that are due for review will be shown. Once all have been reviewed, the app will exit with "Practice complete!".
See [this commit in GitHub](https://github.com/shane-lamb/ruby-recall/commit/f9e7e577d7d556be0c37b59017502df14dd1a5de) for the full code from this post.

That's all for part 2. Next up, we'll be building card creation functionality right into the app, which means we'll need to introduce a menu system. See you next time!
