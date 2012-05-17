// Generated by CoffeeScript 1.2.1-pre
/*
@author Matt Crinklaw-Vogt
*/

define(["common/Calcium", "./SlideCollection", "./Slide", "model/common_application/UndoHistory"], function(Backbone, SlideCollection, Slide, UndoHistory) {
  var NewSlideAction, RemoveSlideAction;
  NewSlideAction = function(deck) {
    this.deck = deck;
    return this;
  };
  NewSlideAction.prototype = {
    "do": function() {
      var slides;
      slides = this.deck.get("slides");
      if (!(this.slide != null)) {
        this.slide = new Slide({
          num: slides.length
        });
      }
      slides.add(this.slide);
      return this.slide;
    },
    undo: function() {
      this.deck.get("slides").remove(this.slide);
      return this.slide;
    },
    name: "Create Slide"
  };
  RemoveSlideAction = function(deck, slide) {
    this.deck = deck;
    this.slide = slide;
    return this;
  };
  RemoveSlideAction.prototype = {
    "do": function() {
      var slides;
      slides = this.deck.get("slides");
      slides.remove(this.slide);
      return this.slide;
    },
    undo: function() {
      return this.deck.get("slides").add(this.slide);
    },
    name: "Remove Slide"
  };
  return Backbone.Model.extend({
    initialize: function() {
      var slides;
      this.undoHistory = new UndoHistory(20);
      this.set("slides", new SlideCollection());
      slides = this.get("slides");
      slides.on("add", this._slideAdded, this);
      slides.on("remove", this._slideRemoved, this);
      slides.on("reset", this._slidesReset, this);
      return this._lastSelected = null;
    },
    newSlide: function() {
      var action, slide;
      action = new NewSlideAction(this);
      slide = action["do"]();
      this.undoHistory.push(action);
      return slide;
    },
    set: function(key, value) {
      if (key === "activeSlide") this._activeSlideChanging(value);
      return Backbone.Model.prototype.set.apply(this, arguments);
    },
    "import": function(rawObj) {
      var activeSlide, slides;
      slides = this.get("slides");
      activeSlide = this.get("activeSlide");
      if (activeSlide != null) activeSlide.unselectComponents();
      this.set("activeSlide", null);
      return slides.reset(rawObj.slides);
    },
    _activeSlideChanging: function(newActive) {
      var lastActive;
      lastActive = this.get("activeSlide");
      if (newActive === lastActive) return null;
      if (lastActive != null) {
        lastActive.unselectComponents();
        lastActive.set({
          active: false,
          selected: false
        });
      }
      if (newActive != null) {
        return newActive.set({
          selected: true,
          active: true
        });
      }
    },
    _slideAdded: function(slide, collection) {
      this.set("activeSlide", slide);
      return this._registerWithSlide(slide);
    },
    _slideDisposed: function(slide) {
      return slide.off(null, null, this);
    },
    _slideRemoved: function(slide, collection, options) {
      console.log("Slide removed");
      if (this.get("activeSlide") === slide) {
        if (options.index < collection.length) {
          this.set("activeSlide", collection.at(options.index));
        } else if (options.index > 0) {
          this.set("activeSlide", collection.at(options.index - 1));
        } else {
          this.set("activeSlide", null);
        }
      }
      return slide.dispose();
    },
    _slidesReset: function(newSlides, options, oldSlides) {
      var _this = this;
      oldSlides.forEach(function(slide) {
        return slide.dispose();
      });
      return newSlides.forEach(function(slide) {
        _this._registerWithSlide(slide);
        if (slide.get("active")) {
          return slide.trigger("change:active", slide, true);
        } else if (slide.get("selected")) {
          return slide.set("selected", false);
        }
      });
    },
    _slideActivated: function(slide, value) {
      if (value) return this.set("activeSlide", slide);
    },
    _slideSelected: function(slide, value) {
      if ((this._lastSelected != null) && value && this._lastSelected !== slide) {
        this._lastSelected.set("selected", false);
      }
      return this._lastSelected = slide;
    },
    _registerWithSlide: function(slide) {
      slide.on("change:active", this._slideActivated, this);
      slide.on("change:selected", this._slideSelected, this);
      return slide.on("dispose", this._slideDisposed, this);
    },
    removeSlide: function(slide) {
      var action;
      action = new RemoveSlideAction(this, slide);
      slide = action["do"]();
      this.undoHistory.push(action);
      return slide;
    },
    addSlide: function(slide) {
      return this.get("slides").add(slide);
    },
    undo: function() {
      return this.undoHistory.undo();
    },
    redo: function() {
      return this.undoHistory.redo();
    }
  });
});
