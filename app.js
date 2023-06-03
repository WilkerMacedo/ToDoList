//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); //require mongoose
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//connect node to mongodb
mongoose.connect("mongodb+srv://wilkernmacedo:segredo@cluster0.q0rcjne.mongodb.net/todolistDB", {
  useNewUrlParser: true
});
//schema
const itemsSchema = {
  name: String
};
//new mongoose model
const Item = mongoose.model("Item", itemsSchema);

//default mongoose documents
const item1 = new Item({
  name: "Welcome to our ToDo List!"
});
const item2 = new Item({
  name: "Hit + to add new items!"
});
const item3 = new Item({
  name: "<-- hit here to delete!"
});
//add items to an array
const defaultItems = [item1, item2, item3];

//newSchema for New lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

//mongoose.connection.close();

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    //const day = date.getDate();

    if (foundItems.length === 0) {
      //insert documents
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("default item inserted!")
        };
      });
      //redirect to main page after checking length of array
      res.redirect("/");
    } else { // render default items from array to main page
      res.render("list", {listTitle: "today",newListItems: foundItems});
    };
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({name: itemName});

if (listName === "today") {
  item.save(function(err){
if(!err) {
console.log("added item on regular list");
}});//saves item in DB
  res.redirect("/");//resets site to show results
} else {
  List.findOne ({name: listName}, function (err, foundList) {
    foundList.items.push(item);
    foundList.save(function(err){
  if(!err) {
  console.log("added item to custom list");
}});//saves item in DB
    res.redirect("/" + listName);//resets custom site to show results
  });
};
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox; //pick click
  const listName2 = req.body.listName;

  if (listName2 === "today") {

  Item.findByIdAndRemove(checkedItemId, function(err) { //remove item by id
    if (!err) {
      console.log("item deleted on regular list");
      res.redirect("/"); // should redirect to main page
    };
  });

    } else {

      List.findOneAndUpdate(
        {name: listName2},
        {$pull: {items: {_id: checkedItemId}}},
        function (err, foundList) {
          if (!err) {
            console.log("item deleted on custom list");
            res.redirect("/" + listName2);
          };
        });
    };
});

app.get("/:customListName", function(req, res) {
  var customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) { //if no error then

      if (!foundList) { // if list doesn't exist, create new list and redirect to it
      console.log("List doesn't exist, creating new");
      var list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save(function(err){
    if(!err) {
    console.log("list is successfully saved");
  }}); //log is optional
      res.redirect("/" + customListName);
    } else { // if list exists, just show it
      console.log("list exists, showing it");
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
      };

    };
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
