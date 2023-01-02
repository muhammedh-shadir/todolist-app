require('dotenv').config({path:__dirname+'/.env'});
// requiring express
const express = require("express");
//requiring body parser
const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const _ = require("lodash");
//requring own crated model
const app = express();

//setting up the ejs
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}))
//settng up to get the static file
app.use(express.static("public"));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URL);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listsSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully default items added.");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });


})

app.post("/", function(req, res) {
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


})

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
        if (!err) {
        res.redirect("/" + listName);
      }
    });

  }
})

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundLists) {
    if (!err) {
      if (!foundLists) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items});
      }
    }
  });

})

app.get("/about", function(req, res) {
  res.render("about");
})

app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running on port 3000.");
})
