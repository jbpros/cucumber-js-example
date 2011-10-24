Feature: Google for Cucumber
  In order to get more info about Cucumber
  As a BDDer
  I want to find Cucumber resources on Google

  Scenario: find cukes.info
    Given I am on Google
    When I search for "Cucumber BDD"
    Then I see a link to "http://cukes.info/"
