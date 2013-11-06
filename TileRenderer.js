/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    function TileRenderer(tile, app, renderer) {
        this.app = app;
        this.tile = tile;
        this.renderer = renderer;

        this.$li = $('<li></li>').appendTo(this.renderer.$grid);

        this.isArticleMode = (this.app.currentArticle ? true : false);

        this.isRevealed = false;

        this.isDismissing = false;
        this.isDoneDismissing = false;
        this.isBelowMiddle = false;

        this.renderedX = null;
        this.renderedY = null;
        this.renderedOpacity = null;
        this.renderedTransition = false;

        this.$li.html(this.tile.html);

        this.$li.css({
            position: 'absolute',
            opacity: 0
        });

        if (!this.isArticleMode) {
            this.isRevealed = this.getVisibility();
        }

        this.renderTile();

        $(this.tile).on('moved', this.onMoved.bind(this));
        $(this.renderer).on('tilesDismissed', this.onTilesDismissed.bind(this));
        $(this.renderer).on('tilesRestored', this.onTilesRestored.bind(this));
        $(this.renderer).on('viewport', this.onViewport.bind(this));
    }

    TileRenderer.prototype.renderTile = function () {
        var scrollBackAmount = this.app.currentArticle ? this.app.currentArticle.scrollBackAmount : 0,
            animationAmount = Math.abs(scrollBackAmount),
            verticalOffset = (this.isArticleMode && this.isDismissing) ?
                (this.isBelowMiddle ? 1 : -1) * (this.isDoneDismissing ? (1 - animationAmount) * 300 : 200) :
                0,

            tileOpacity = (!this.isArticleMode && this.isRevealed) ? 1 : (this.isArticleMode && this.isDismissing && this.isDoneDismissing ? animationAmount : 0),
            tileX = this.tile.x,
            tileY = this.tile.y + verticalOffset,
            tileTransition = this.isDismissing && this.isDoneDismissing ? false : true;

        // update transitioning first
        if (this.renderedTransition !== tileTransition) {
            this.$li.css({
                transition: (this.renderedTransition = tileTransition) ? 'top 1s, left 1s, opacity 1.5s' : 'none'
            });
        }

        if (this.renderedX !== tileX || this.renderedY !== tileY) {
            this.$li.css({
                left: this.renderedX = tileX,
                top: this.renderedY = tileY
            });
        }

        if (this.renderedOpacity !== tileOpacity) {
            this.$li.css({
                opacity: this.renderedOpacity = tileOpacity
            });
        }
    };

    TileRenderer.prototype.getVisibility = function () {
        return (this.tile.y + this.tile.height > this.renderer.gridViewportTop && this.tile.y < this.renderer.gridViewportBottom);
    };

    TileRenderer.prototype.onMoved = function () {
        this.renderTile();

        if (!this.isArticleMode) {
            this.isRevealed = this.getVisibility();
            this.renderTile();
        }
    };

    TileRenderer.prototype.onTilesDismissed = function () {
        var gridViewportMidpoint = (this.renderer.gridViewportTop + this.renderer.gridViewportBottom) * 0.5;

        if (this.isArticleMode) {
            throw 'cannot dismiss if already in article mode';
        }

        this.isArticleMode = true;

        if (this.getVisibility()) {
            this.isDismissing = true;
            this.isDoneDismissing = false;
            this.isBelowMiddle = this.tile.y + this.tile.height * 0.5 > gridViewportMidpoint;

            $(this.app.currentArticle).on('scrolledAbove scrolledBelow returnedAbove returnedBelow', function () {
                this.isDoneDismissing = true;

                this.renderTile();
            }.bind(this));
        } else {
            this.isDismissing = false;
        }

        this.renderTile();
    };

    TileRenderer.prototype.onTilesRestored = function () {
        if (!this.isArticleMode) {
            throw 'cannot restore if not in article mode';
        }

        this.isArticleMode = false;

        this.isRevealed = this.getVisibility();
        this.renderTile();
    };

    TileRenderer.prototype.onViewport = function () {
        if (this.isArticleMode) {
            throw 'cannot change viewport in article mode';
        }

        this.isRevealed = this.getVisibility();
        this.renderTile();
    };

    return TileRenderer;
});
