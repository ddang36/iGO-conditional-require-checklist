const core = require("@actions/core");
const github = require("@actions/github");

const TASK_LIST_ITEM_CHANGE_TYPE = /\bScreen Change|PDF|103 XSL Update|Config|Performance|VB Custom Assembly|JS Custom Assembly\b/g;
const SCREEN_TASK_LIST_CHANGE_ACTION_ITEM = /\bScreen Status Validation|Object Properties Validation|Screen and Object Trigger\b/g;

async function action() {
  const bodyList = [];

  const token = core.getInput("token");
  const octokit = github.getOctokit(token);

  const { data: issue } = await octokit.rest.issues.get({
    ...github.context.repo,
    issue_number: github.context.issue.number,
  });

  if (issue.body) {
    bodyList.push(issue.body);
  }

  const { data: comments } = await octokit.rest.issues.listComments({
    ...github.context.repo,
    issue_number: github.context.issue.number,
  });

  for (let comment of comments) {
    bodyList.push(comment.body);
  }

  // Check each comment for a checklist
  let containCheckList = false;
  let ScreenChangeContainsChecklist = false;
  let PDFChangeContainChecklist = false;
  var changeTypeincompleteItems = [];
  var screenChangeIncompleteItems = [];
  
  for (let body of bodyList) {
    var matches = [...body.matchAll(TASK_LIST_ITEM)];
	var screenActionMatch = [..body.matchAll(SCREEN_TASK_LIST_CHANGE_ACTION_ITEM)];
    for (let item of matches) {
      var is_complete = item[1] != " ";
      var item_text = item[2];

	  if (item_text == "Screen Change") {
		  for (let item of screenActionMatch) {
			  var screen_action_is_complete = item[1] != " ";
			  var screen_action_item_text = item[2];
			  if (screen_action_is_complete) {
				  containCheckList = true;
				console.log("Completed task list item: " + item[2]);
			  } else {
				console.log("Incomplete task list item: " + item[2]);
				changeTypeincompleteItems.push(item[2]);
			  }
		  }
	  }
      if (is_complete) {
        console.log("Completed task list item: " + item[2]);
      } else {
        console.log("Incomplete task list item: " + item[2]);
        changeTypeincompleteItems.push(item[2]);
      }
    }
	
	
  }

  if (changeTypeincompleteItems.length > 0) {
    core.setFailed(
      "The following items are not marked as completed: " +
        "change type : " + changeTypeincompleteItems.join(", ")
    );
    return;
  }

  const requireChecklist = core.getInput("requireChecklist");
  if (requireChecklist != "false" && !containsChecklist) {
    core.setFailed(
      "No task list was present and requireChecklist is turned on"
    );
    return;
  }

  console.log("There are no incomplete task list items");
}

if (require.main === module) {
  action();
}

module.exports = action;
