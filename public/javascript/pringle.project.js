(function($) {
  var Project = function(name, opts) {
    this.name = name;
    
    var defaultCharts = {
      cardsByType: function(cards) {
        _(cards).reduce(function(memo, card) {
          var oldValue = memo[card.card_type.name];
          memo[card.card_type.name] = ( oldValue || 0 ) + 1;
          return memo;
        }, {});
      }
    };
    
    var defaultCardMethods = {
      property: function(propName) {
        var property = _(this.properties).find(function(o) {
          return o.name === propName;
        });
        return ( property || {} ).value;
      },

      status: function() {
        return this.property(this.project.options.statusName);
      }
    };
    
    this.options = {};
    
    _.extend(this.options, opts);
    this.options.cardMethods = _.extend(defaultCardMethods, opts.cardMethods);
    this.options.charts = _.extend(defaultCharts, opts.charts);
    
    $(this).bind("pringle.project.get", this._getProject).
            bind("pringle.cardTypes.get", this._getCardTypes).
            bind("pringle.statuses.get", this._getStatuses).
            bind("pringle.cards.get", this._getCards).
            bind("pringle.mql.request", this._reqMql);
  };
  
  _.extend(Project.prototype, Backbone.Events, {
    _mingle: function(path, params, callback) {
      if (_.isFunction(params)) {
        callback = params;
        params = {};
      }

      params = typeof(params) === "string" ? params : $.param(params || {});
      path = "/projects/" + this.name + path;
      callback = _.bind(callback, this);
      
      $.get("/mingle", { path: path, params: params }, callback, "jsonp");
    },
    
    _getProject: function(evt) {
      this._mingle("", this._setProject);
    },
    
    _setProject: function(data) {
      $(this).trigger("pringle.project.set", [ data ]);
    },
    
    _getCardTypes: function(evt) {
      this._mingle("/card_types", this._setCardTypes);
    },
    
    _setCardTypes: function(data) {
      $(this).trigger("pringle.cardTypes.set", [ data ])
    },
    
    _getStatuses: function(evt) {
      this._mingle("/property_definitions/" + this.options.statusId, this._setStatuses);
    },
    
    _setStatuses: function(data) {
      $(this).trigger("pringle.statuses.set", [ data ]);
    },
    
    _getCards: function(evt, params) {
      params = (_.isNull(params) || _.isUndefined(params)) ? { page: 1 } : params;
      this._mingle("/cards", params, this._setCards);
    },
    
    _setCards: function(data) {
      _(data.cards).each(function(card) {
        _.extend(card, this.options.cardMethods, { project: this });
      }, this);

      $(this).trigger("pringle.cards.set", [ data ]);
    },
    
    _reqMql: function(evt, params) {
      console.log(params);
      this._mingle("/cards/execute_mql", { mql: params }, this._resMql);
    },
    
    _resMql: function(data) {
      $(this).trigger("pringle.mql.response", [ data ]);
    }
  });
  
  _.bindAll(Project);
  
  $.projects = _([]);
  
  $.project = function(name) {
    return $.projects.find(function(proj) { return proj.name === name; });
  };
  
  $.projects.define = function(name, opts) {
    this.push(new Project(name, opts));
  };
})(jQuery);