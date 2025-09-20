# Objectives of the Pull Request ? 
> Describe the high level purpose of your pull request. What are you trying to achieve ? How are you doing it ?

# What is left out of the Pull Request ? 
> Describe what is not included in the pull request. Why did you not include it in the PR. What are the next steps ?

# How to run the pull request ?
> Provide the code required to run the pull request. This is the code that will be used to review your pull request. **The provided code must work as-is. If a react-native error is raised while running the code, the PR will be rejected. The following code / placeholder is only provided as documentation / helper to get you started and you will need to adjust it.**

```bash
# Assuming you are in a folder containing minicap_concordia_campus_guide_app/application folder.
# Update the code
git checkout feature/<feature_name>
git pull
# Might be required if you update check the PR

```

# Checklist
> Please, read carefully each item before checking it. Your PR's review might be delayed otherwise.

* **Code** :
  * [ ] I have added all necessary unit tests to demonstrate that my code functions as expected and is testable.
  * [ ] The code I'm asking a review for is working. **I understand that my PR will be rejected as-is otherwise.**
  * [ ] My code follows the conventions described in the `contribution guide`.
 
* **Documentation** : 
  * [ ]  I have updated the documentation (README) accordingly to my changes.
 
* **Pull-request** : 
  * [ ]  My merge message is prefixed with a `commitizen` key word so it looks something like `<feat|fix|chore|doc|refactor|perf|style>: foo bar`**
  * [ ]  The code *provided to run the pull request* is working. **I understand that my PR will be rejected as-is otherwise.**
  * [ ]  My pull request is documented. I have explained the needs for the PR, what was left out of the it and why.
  * [ ]  I have carefully reviewd each changes made to a file and made sure the files included on the PR were actually added on purpose.
  * [ ]  I have assignee at least **3** people to review my PR.