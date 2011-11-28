Feature: Todos
  Because this is the most revolutionary idea since
  the invention of the toaster.

  Scenario: add a todo to my list
    Given I have nothing to do
    When I add a new task
    Then I have some tasks to do
