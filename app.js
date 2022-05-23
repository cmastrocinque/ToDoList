//jshint esversion:6
const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

main().catch(err => console.log(err));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const url = process.env.MONGOLAB_URI;

async function main() {
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  await mongoose.connect("mongodb+srv://" + user + ":" + password + "@cluster0.ghm6g.mongodb.net/todolistDB");
}
// /'mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ghm6g.${process.env.DB_HOST}/todolistDB'
const itemsSchema = new mongoose.Schema ({
	name: String
});

const Item = new mongoose.model ("Item", itemsSchema);

const makeDinner = new Item ({
	name: "Make dinner"
});

const laundry = new Item ({
	name: "Do laundry"
});

const callNonna = new Item ({
	name: "Call nonna"
});

const defaultItems = [makeDinner, laundry, callNonna];

const listSchema = new mongoose.Schema ({
	name: String,
  items: [itemsSchema]
});

const List = new mongoose.model ("List", listSchema);


app.get("/", function(req, res) {
  //find all items in items collection and pass to list.ejs
  Item.find({}, function(err, foundItems){
    //prevent multiple copies, if no items in array, insert defaultItems into
    //items array and redirect to "/" to run if else statement again so that
    //it pushes to else statement and renders the foundItems to server
    if (foundItems.length==0){
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checkedItem");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
