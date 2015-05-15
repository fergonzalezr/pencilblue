/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for managing articles
     */
    function ManageArticles(){}
    util.inherits(ManageArticles, pb.BaseController);

    ManageArticles.prototype.init = function (props, cb) {
        this.pathSiteUId = pb.SiteService.getCurrentSite(props.path_vars.siteid);
        this.queryService = new pb.SiteQueryService(this.pathSiteUId, true);
        this.sitePrefix = pb.SiteService.getCurrentSitePrefix(this.pathSiteUId);

        pb.BaseController.prototype.init.call(this, props, cb);
    };

    //statics
    var SUB_NAV_KEY = 'manage_articles';

    ManageArticles.prototype.render = function(cb) {
        var self = this;
        var where = {};
        if(!pb.security.isAuthorized(this.session, {logged_in: true, admin_level: pb.SecurityService.ACCESS_EDITOR})) {
            where.author = this.session.authentication.user_id;
        }

        var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: where,
            order: {publish_date: pb.DAO.ASC},

        };
        self.queryService.q('article', opts, function(err, articles) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (articles.length <= 0) {
                return self.redirect('/admin' + self.sitePrefix + '/content/articles/new', cb);
            }

            pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {
                articles = self.getArticleStatuses(articlesWithAuthorNames);
                self.getAngularObjects(self.pathSiteUId, articles, function (angularObjects) {
                    var manageArticlesStr = self.ls.get('MANAGE_ARTICLES');
                    self.setPageName(manageArticlesStr);
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    self.ts.load('admin/content/articles/manage_articles', function (err, data) {
                        var result = '' + data;
                        cb({content: result});
                    });
                });
            });
        });
    };

    ManageArticles.prototype.getArticleStatuses = function(articles) {
        var now = new Date();
        for(var i = 0; i < articles.length; i++) {
            if(articles[i].draft) {
                articles[i].status = this.ls.get('DRAFT');
            }
            else if(articles[i].publish_date > now) {
                articles[i].status = this.ls.get('UNPUBLISHED');
            }
            else {
                articles[i].status = this.ls.get('PUBLISHED');
            }
        }

        return articles;
    };

    ManageArticles.prototype.getAngularObjects = function(site, articles, cb) {
        var self = this;
        pb.AdminSubnavService.getWithSite(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {site: site}, function(pills) {
            var angularObjects = pb.ClientJs.getAngularObjects(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'articles'], self.ls),
                    pills: pills,
                    articles: articles,
                    sitePrefix: self.sitePrefix
                });
            cb(angularObjects);
        });
    };

    ManageArticles.getSubNavItems = function(key, ls, data) {
        var adminPrefix = '/admin';
        if(data.site) {
            adminPrefix += pb.SiteService.getCurrentSitePrefix(data.site);
        }
        return [{
            name: 'manage_articles',
            title: ls.get('MANAGE_ARTICLES'),
            icon: 'refresh',
            href: adminPrefix + '/content/articles'
        }, {
            name: 'new_article',
            title: '',
            icon: 'plus',
            href: adminPrefix + '/content/articles/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageArticles.getSubNavItems);

    //exports
    return ManageArticles;
};
