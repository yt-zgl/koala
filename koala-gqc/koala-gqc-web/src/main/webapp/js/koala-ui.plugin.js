/**
 * Created with JetBrains WebStorm.
 * User: wangjianbing
 * Date: 13-9-25
 * KoalaUI组件
 */
/*
 * 表格组件
 */
+function(){

	"use strict"
	var Grid = function(element, options){
		this.$element = $(element);
		this.options = options;
		this.pageSize = options.pageSize;
		this.pageNo = options.pageNo;
		this.showPage = options.showPage;
		this.searchCondition = {};
		this.sortName = null;
		this.sortOrder = null;
		this._initLayout();
		this._initHead();
		this._initOptions();
		this._initEvents();
		if(this.options.autoLoad){
			var that = this
			setTimeout(function(){
				that._loadData();
			},0)
		}
	}
	Grid.DEFAULTS = {
		loadingText: '正在载入...', //数据载入时的提示文字
		noDataText: '没有数据',    //没有数据时的提示文字
		isShowIndexCol: true, //是否显示索引列
		isShowButtons: false,
		autoLoad: true, //是否表格准备好时加载数据
		method: 'POST', //请求数据方式
		identity: 'id', //主键
		lockWidth: false,
		pageSize: 10,
		pageNo: 1,
		showPage: 4
	}
	Grid.prototype = {
		Constructor: Grid,
		_initLayout: function(){
			this.table = $(Grid.DEFAULTS.TEMPLATE).appendTo(this.$element);
			this.buttons = this.$element.find('.buttons');
			this.addBtn = this.$element.find('[data-role="add"]');
			this.modifyBtn = this.$element.find('[data-role="modify"]');
			this.deleteBtn = this.$element.find('[data-role="delete"]');
			this.searchContainer = this.$element.find('.search');
			this.condition = this.searchContainer.find('[data-role="condition"]');
			this.totalRecord = this.$element.find('[data-role="total-record"]');
			this.startRecord = this.$element.find('[data-role="start-record"]');
			this.endRecord = this.$element.find('[data-role="end-record"]');
			this.pages = this.$element.find('.pages');
			this.grid = this.$element.find('.grid');
			this.gridBody = this.$element.find('.grid-body').css('width', this.$element.width());
			this.gridTableHead = this.$element.find('.grid-table-head');
			this.gridTableHeadTable = this.gridTableHead.find('table');
			this.gridTableBody = this.$element.find('.grid-table-body').css('width', this.$element.width());
			this.gridTableBodyTable = this.gridTableBody.find('table');
			this.pageSizeSelect = this.$element.find('[data-role="pageSizeSelect"]');
			!this.options.isShowButtons && this.buttons.hide();
			this.colResizePointer = this.table.find('.colResizePointer')
		},
		_initHead: function(){
			var that = this;
			var columns = this.options.columns;
			if(!columns || columns.length == 0){
				$('body').message({
					type: 'warning',
					content: '没有列数据'
				})
			}
			var totalColumnWidth = 0;
			var widthRgExp= /^[1-9]\d*\.?\d*(px){0,1}$/;
			var titleHtml = new Array();
			titleHtml.push('<tr>');
			if(this.options.isShowIndexCol){
				titleHtml.push('<th width="50px;"><div class="checker"><span><input type="checkbox" style="opacity: 0;" data-role="selectAll"></span></div></th>');
			}
			for(var i= 0, j=columns.length; i<j; i++){
				var column = columns[i];
				var width = column.width + '';
				titleHtml.push('<th index="'+i+'" width="');
				if(width.match(widthRgExp)){
					width = width.replace('px', '');
					totalColumnWidth +=  parseInt(width);
					titleHtml.push(width +'px"');
				}else{
					titleHtml.push(column.width+'"');
				}
				if(column.sortable && column.sortName){
					titleHtml.push(' class="sort" sortName="'+column.sortName+'" title="点击排序"');
				}
				titleHtml.push('>');
				titleHtml.push(column.title);
				if(!this.options.lockWidth){
					titleHtml.push('<div class="colResize"></div>');
				}
				titleHtml.push('</th>');
			}
			if(totalColumnWidth > this.$element.width()){
				//this.gridTableHead.css({'width': totalColumnWidth});
				this.gridTableHeadTable.css('width', totalColumnWidth);
				this.gridTableBodyTable.css('width', totalColumnWidth);
			}
			this.gridTableHeadTable.html(titleHtml.join(''));
			this.gridTableHeadTable.find('[data-role="selectAll"]').on('click',function() {
				if(this.checked){
					$(this).parent().addClass('checked');
					that.gridTableBodyTable.find('.checker').find('input:checkbox').each(function(){
						this.checked = false;
						$(this).click();
					})
				}else{
					$(this).parent().removeClass('checked');
					that.gridTableBodyTable.find('.checker').find('input:checkbox').each(function(){
						this.checked = true;
						$(this).click();
					})
				}
			});
			var sorts = this.gridTableHeadTable.find('.sort');
			sorts.on('click', function(e){
				e.stopPropagation();
				var $this = $(this);
				that.sortName = $this.attr('sortName');
				if($this.hasClass('sorting-asc')){
					sorts.removeClass('sorting-asc').removeClass('sorting-desc').find('span').remove();
					$this.removeClass('sorting-asc').addClass('sorting-desc')
					$this.find('span').remove().end().append($('<span class="glyphicon glyphicon-arrow-down"></span>'))
					that.sortOrder = 'desc';
				}else{
					sorts.removeClass('sorting-asc').removeClass('sorting-desc').find('span').remove();
					$this.removeClass('sorting-desc').addClass('sorting-asc')
					$this.find('span').remove().end().append($('<span class="glyphicon glyphicon-arrow-up"></span>'));
					that.sortOrder = 'asc';
				}
				that._loadData();
			})
			this.gridTableHeadTable.find('.colResize').on('mousedown', function(e){
				e.stopPropagation();
				var $this = $(this);
				var start = e.pageX;
				var left = that.gridTableHead.offset().left;
				that.colResizePointer.css({'height': that.gridBody.height(), 'left': e.pageX - that.gridTableBody.scrollLeft() - left}).show();
				that.grid.css({'-moz-user-select': 'none', 'cursor': 'move'}).on({
					'selectstart': function (){
						return false;
					},
					'mousemove': function(e){
						that.colResizePointer.css({'left': e.pageX - that.gridTableBody.scrollLeft() - left}).show();
					},
					'mouseup': function(e){
						var end = e.pageX;
						var $th = $this.parent();
						var width = parseFloat($th.attr('width')) + end - start;
						$th.attr('width', width);
						var index = $th.attr('index');
						that.gridTableBodyTable.find('td[index="'+index+'"]').attr('width', width);
						$(this).css({'-moz-user-select': '-moz-all', 'cursor': 'default'}).off('selectstart').off('mouseup').off('mousemove');
						that.colResizePointer.hide();
						that.options.columns[index].width = width;
					}
				})
			})
		},
		_initOptions: function(){
			var that = this;
			//每页记录数
			this.pageSizeSelect.select({
				contents: [
					{value: '5', title: '5'},
					{value: '10', title: '10'},
					{value: '20', title: '20'},
					{value: '50', title: '50'},
					{value: '100', title: '100'}
				]
			});
			this.pageSizeSelect.setValue(this.options.pageSize).on('change', function(){
				that.pageSize = $(this).getValue();
				that.pageNo = Grid.DEFAULTS.pageNo;
				that._loadData();
			});
			if(that.options.querys && that.options.querys.length>0){
				this.condition.select({
					title: '选择条件',
					contents: that.options.querys
				});
			}else{
				this.searchContainer.hide();
				!this.options.isShowButtons && this.searchContainer.parent().hide();
			}
		},
		_initEvents: function(){
			var that = this;
			this.addBtn.on('click', function(){
				that.$element.trigger('add');
			});
			this.modifyBtn.on('click', function(){
				var length =  that.selectedRowsIndex().length;
				if(length == 0){
					that.$element.message({
						type: 'warning',
						content: '请选择一条记录进行修改'
					})
					return;
				}
				if(length > 1){
					that.$element.message({
						type: 'warning',
						content: '只能选择一条记录进行修改'
					})
					return;
				}
				that.$element.trigger('modify', that.selectedRowsIndex()[0]);
			});
			this.deleteBtn.on('click', function(){
				var length =  that.selectedRowsIndex().length;
				if(length == 0){
					that.$element.message({
						type: 'warning',
						content: '请选择要删除的记录'
					})
					return;
				}
				var index = that.selectedRowsIndex();
				that.$element.trigger('delete', index.join(','));
			});
			this.gridTableBody.on('scroll', function(){
				that.gridTableHead.css('left', -$(this).scrollLeft());
			});
			this.searchContainer.find('button[data-role="searchBtn"]').on('click', function(){
				var condition = that.condition.getValue();
				if(!condition){
					that.$element.message({
						type: 'warning',
						content: '请选择查询条件'
					})
					return;
				}
				var value =  that.searchContainer.find('input[data-role="searchValue"]').val().replace(/(^\s*)|(\s*$)/g, "");
				that.searchCondition[condition] =  value;
				that._loadData();
			});
		},
		/*
		 *加载数据
		 */
		_loadData: function(){
			var that = this;
			var params = {};
			params.pagesize = that.pageSize;
			params.page = that.pageNo;
			for(var prop in that.searchCondition){
				params[prop] = that.searchCondition[prop];
			}
			if(that.sortName && that.sortOrder){
				params.sortname = that.sortName;
				params.sortorder = that.sortOrder
			}
			$.ajax({
				type: this.options.method,
				url: this.options.url,
				data: params,
				dataType: 'json'
			}).done(function(result){
					that.startRecord.text(result.start);
					that.endRecord.text(result.start + result.limit);
					that.totalRecord.text(result.Total);
					that._initPageNo(result.Total)
					that.items = result.Rows;
					that.renderRows()
				}).fail(function(result){

				})
		},
		/*
		 * 初始化分页
		 */
		_initPageNo: function(totalRecord){
			var that = this;
			var pageSize = that.pageSizeSelect.getValue();
			this.totalPage = Math.floor(totalRecord / pageSize);
			if(totalRecord % pageSize != 0){
				this.totalPage ++;
			}
			if(this.totalPage == 0){
				this.pages.hide();
				return;
			}
			var pagination = that.pages.find('ul.pagination');
			var pageHtml = new Array();
			pageHtml.push('<li data-role="firstPage"><a href="#">&laquo;</a></li>');
			pageHtml.push('<li data-role="prev"><a href="#">&lsaquo;</a></li>');
			if((that.pageNo-1) % that.showPage == 0){
				that.pageNo != 1 && pageHtml.push('<li><a href="#">...</a></li>');
				for(var i=that.pageNo; i<=that.totalPage && i<(that.pageNo+that.showPage); i++){
					pageHtml.push('<li data-value="'+i+'" data-role="pageNo"><a href="#">'+i+'</a></li>');
				}
				(that.pageNo + that.showPage) < that.totalPage && pageHtml.push('<li><a href="#">...</a></li>');
			}else{
				var start = Math.floor((that.pageNo-1)/that.showPage)*that.showPage+1;
				start != 1 && pageHtml.push('<li><a href="#">...</a></li>');
				for(var i=start; i<=that.totalPage && i<(start+that.showPage); i++){
					pageHtml.push('<li data-value="'+i+'" data-role="pageNo"><a href="#">'+i+'</a></li>');
				}
				(start + that.showPage) < that.totalPage && pageHtml.push('<li><a href="#">...</a></li>');
			}
			pageHtml.push('<li data-role="next"><a href="#">&rsaquo;</a></li>');
			pageHtml.push('<li data-role="lastPage" ><a href="#">&raquo;</a></li>');
			pagination.html(pageHtml.join('')).find('li[data-role="pageNo"]').on('click', function(){
				that.pageNo = $(this).data('value');
				that._loadData();
			}).end().find('li[data-value="'+that.pageNo+'"]').addClass('active');
			var prevBtn =  pagination.find('li[data-role="prev"]').on('click', function(){
				if($(this).hasClass('disabled')){
					return;
				}
				that.pageNo-- ;
				that.pageOperateStatus = 'prev';
				that._loadData();
			});
			var nextBtn =  pagination.find('li[data-role="next"]').on('click', function(){
				if($(this).hasClass('disabled')){
					return;
				}
				that.pageNo++ ;
				that.pageOperateStatus = 'next';
				that._loadData();
			});
			var firstPageBtn =  pagination.find('li[data-role="firstPage"]').on('click', function(){
				if($(this).hasClass('disabled')){
					return;
				}
				that.pageNo = 1;
				that._loadData();
			});
			var lastPageBtn =  pagination.find('li[data-role="lastPage"]').on('click', function(){
				if($(this).hasClass('disabled')){
					return;
				}
				that.pageNo = that.totalPage;
				that._loadData();
			});
			that.pageNo == 1 && prevBtn.addClass('disabled') && firstPageBtn.addClass('disabled');
			that.pageNo == that.totalPage && nextBtn.addClass('disabled') && lastPageBtn.addClass('disabled');
		},
		/*
		 * 渲染数据
		 */
		renderRows: function(){
			var that = this;
			var items = this.items;
			var trHtmls = new Array();
			for(var i= 0,j=items.length; i<j; i++){
				var item = items[i];
				var trHtml = new Array();
				trHtml.push('<tr>');
				if(this.options.isShowIndexCol){
					trHtml.push('<td width="50px;"><div class="checker"><span><input type="checkbox"  data-role="indexCheckbox" style="opacity: 0;" value="'+item[this.options.identity]+'"></span></div></td>')
				}
				for(var k=0,h=this.options.columns.length; k<h; k++){
					var column = this.options.columns[k];
					trHtml.push('<td index="'+k+'" width="'+column.width+'"');
					if(column.align){
						trHtml.push(' align="'+column.align+'"');
					}
					trHtml.push('>');
					if(column.render){
						trHtml.push(column.render(item,column.name,i));
					}else{
						trHtml.push(item[column.name]);
					}
					trHtml.push('</td>');
				}
				trHtml.push('</tr>');
				trHtmls.push(trHtml.join(''));
			}
			this.gridTableBodyTable.html(trHtmls.join(''));
			var indexCheckboxs = this.gridTableBodyTable.find('[data-role="indexCheckbox"]')
			indexCheckboxs.on('click',function(e) {
				e.stopPropagation();
				var $this = $(this);
				if(this.checked){
					$this.parent().addClass('checked').closest('tr').addClass('success');
				}else{
					$this.parent().removeClass('checked').closest('tr').removeClass('success')
				}
				if(that.selectedRowsIndex().length == indexCheckboxs.length){
					that.gridTableHeadTable.find('[data-role="selectAll"]').attr('checked','checked').parent().addClass('checked');
				}else{
					that.gridTableHeadTable.find('[data-role="selectAll"]').attr('checked','').parent().removeClass('checked');
				}
			});
			this.gridTableBodyTable.find('tr').on('click', function(){
				$(this).toggleClass('success').find('[data-role="indexCheckbox"]').click();
			})
		},
		/*
		 *返回选择行数据的数组。
		 */
		selectedRows: function(){
			var that = this;
			var selectItems = new Array();
			this.gridTableBodyTable.find('.checker').find('input:checkbox:checked').each(function(){
				selectItems.push(that.items[$(this).val()]);
			})
			return  selectItems;
		},
		/*
		 *返回选择行索引的数组。
		 */
		selectedRowsIndex: function(){
			var that = this;
			var selectIndexs = new Array();
			this.gridTableBodyTable.find('.checker').find('input:checkbox:checked').each(function(){
				selectIndexs.push($(this).val());
			})
			return  selectIndexs;
		},
		/**
		 * 刷新表格
		 */
		refresh: function(){
			this.pageNo = Grid.DEFAULTS.pageNo;
			this._loadData();
		},
		/**
		 * 外部查询
		 */
		search: function(conditions){
			for(var prop in conditions){
				this.searchCondition[prop] = conditions[prop];
			}
			this._loadData();
		}
	}
	Grid.DEFAULTS.TEMPLATE = '<div class="table-responsive"><table class="table table-responsive table-bordered grid"><thead><tr><th><div class="btn-group buttons"><button type="button" class="btn btn-primary" data-role="add"><span class="glyphicon glyphicon-plus"></span>&nbsp;新增</button><button type="button" class="btn btn-primary" data-role="modify"><span class="glyphicon glyphicon-edit"></span>&nbsp;修改</button><button type="button" class="btn btn-primary" data-role="delete"><span class="glyphicon glyphicon-remove"></span>&nbsp;刪除</button></div><div class="search"><div class="btn-group select " data-role="condition"></div><div class="input-group" style="width:180px;"><input type="text" class="input-medium form-control" placeholder="Search" data-role="searchValue"><div class="input-group-btn"><button type="button" class="btn btn-default" data-role="searchBtn"><span class="glyphicon glyphicon-search"></span></button></div></div></div></th></tr></thead><tbody><tr><td><div class="colResizePointer"></div><div class="grid-body"><div class="grid-table-head"><table class="table table-bordered"></table></div><div class="grid-table-body"><table class="table table-responsive table-bordered table-hover table-striped"></table></div></div></td></tr></tbody><tfoot><tr><td><div class="records">显示:<span data-role="start-record"></span>-<span data-role="end-record"></span>, 共<span data-role="total-record"></span>条记录。&nbsp;每页显示:<div class="btn-group select " data-role="pageSizeSelect"></div>条</div><div><div class="btn-group pages"><ul class="pagination"></ul></div></div></td></tr></tfoot></table></div>';
	var old = $.fn.grid;
	$.fn.grid = function(option){
		return this.each(function(){
			var $this = $(this);
			var data = $this.data('koala.grid');
			var options = $.extend({}, Grid.DEFAULTS, $this.data(),typeof option == 'object' && option);
			if(!data){
				$this.data('koala.grid',(data = new Grid(this, options)));
			}
			if(typeof option == 'string'){
				data[option]();
			}
		})
	}
	$.fn.grid.Constructor = Grid;
	$.fn.grid.noConflict = function(){
		$.fn.grid = old;
		return this;
	}
}(window.jQuery)

/*
 消息提示组件
 */
+function($){
	"use strict";
	var Message = function(container, options){
		this.container = $(container);
		this.$element = $(Message.DEFAULTS.TEMPLATE);
		this.options = options;
		this.init();
	}
	Message.DEFAULTS = {
		delay: 2000,
		type: 'info'
	}
	Message.prototype.init = function(){
		var that = this;
		this.content = this.$element.find('[data-toggle="content"]').html(this.options.content);
		switch(this.options.type){
			case 'success':
				this.content.before($('<span class="glyphicon glyphicon-info-sign" style="margin-right: 20px;"/>'));
				this.$element.addClass('alert-success');
				break;
			case 'info':
				this.content.before($('<span class="glyphicon glyphicon-info-sign" style="margin-right: 20px;"/>'));
				break;
			case 'warning':
				this.content.before($('<span class="glyphicon glyphicon-warning-sign" style="margin-right: 20px;"/>'));
				this.$element.addClass('alert-warning');
				break;
			case 'error':
				this.content.before($('<span class="glyphicon glyphicon-exclamation-sign" style="margin-right: 20px;"/>'));
				this.$element.addClass('alert-error');
				break;
		}
		var left = ($(window).width()-this.$element.width())/2.2;
		var top = ($(window).height()-this.$element.height())/2.2;
		this.$element.appendTo(this.container)
			.css({'position': 'fixed', 'left': left + 'px', 'top': top + 'px'})
			.fadeIn();
		setTimeout(function(){
			that.$element.fadeOut(1000, function(){
				$(this).remove();
			})
		}, this.options.delay)
	}
	Message.DEFAULTS.TEMPLATE = '<div class="alert" style="width: auto;min-width: 200px;max-width: 500px; padding: 8px;text-align: center;z-index: 20000;">' +
		'<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' +
		'<span data-toggle="content"></span>&nbsp;&nbsp;</div>';
	var old = $.fn.message;
	$.fn.message = function(option){
		return this.each(function(){
			var $this = $(this);
			var data = $this.data('koala.message');
			var options = $.extend({}, Message.DEFAULTS, $this.data(), typeof option == 'object' && option);
			$this.data('koala.message',(data = new Message(this, options)));
			if(typeof option == 'string'){
				data[option]();
			}
		})
	}
	$.fn.message.Constructor = Message;
	$.fn.message.noConflict = function(){
		$.fn.message = old;
		return this;
	}
}(window.jQuery)

/**
 * 修改密码
 */
+function ($) {
	"use strict";
	var ModifyPassword = function(container, option){
		this.container = $(container);
		this.$element = $(ModifyPassword.DEFAULTS.TEMPLATE);
		this.modal = this.$element.modal({
			keyboard: false
		});
		console.info(this.modal.find('.modal-dialog').width())
		console.info(this.modal.find('.modal-dialog').height())
		this.modal.find('.modal-dialog').message();
		this.oldPwd = this.$element.find('#oldPassword');
		this.newPwd = this.$element.find('#newPassword') ;
		this.confirmPwd = this.$element.find('#confirmPassword');
		var that = this;
		this.oldPwd.on('blur.koala.modifyPassowrd', $.proxy(this.blur, this, this.oldPwd));
		this.newPwd.on('blur.koala.modifyPassowrd', $.proxy(this.blur, this, this.newPwd));
		this.confirmPwd.on('blur.koala.modifyPassowrd', $.proxy(this.blur, this, this.confirmPwd));
		this.$element.find('.modal-footer button[data-toggle="save"]').on('click.koala.modifyPassowrd', $.proxy(this.save, this))
	}
	ModifyPassword.DEFAULTS = {

	}
	ModifyPassword.prototype.blur = function(obj){
		if(obj.val().length != 0){
			if(obj.attr('id') == 'confirmPassword'){
				obj.val() ==  this.newPwd.val() &&
				obj.parent()
					.removeClass('has-error')
					.end()
					.next('.help-block')
					.hide();
			}else if(obj.attr('id') == 'newPassword'){
				this.confirmPwd.val().length == 0 &&
				obj.parent()
					.removeClass('has-error')
					.end()
					.next('.help-block')
					.hide();
				obj.val() ==  this.confirmPwd.val() &&
				this.confirmPwd.parent()
					.removeClass('has-error')
					.end()
					.next('.help-block')
					.hide();
			}else{
				obj.parent()
					.removeClass('has-error')
					.end()
					.next('.help-block')
					.hide();
			}
		}
	}
	ModifyPassword.prototype.save = function(){
		if(this.isNull(this.oldPwd) || this.isNull(this.newPwd) || this.isNull(this.confirmPwd)){
			return;
		}
		if(this.newPwd.val() != this.confirmPwd.val()){
			this.confirmPwd.focus()
				.parent()
				.addClass('has-error')
				.end()
				.next('.help-block')
				.text('新密码与确认密码不一致!')
				.show();
			return;
		}
		var data = "oldPassword=" + this.oldPwd.val() + "&userVO.userPassword=" + this.newPwd.val();
		$.ajax({
			method:"post",
			url:"auth-User-updatePassword.action",
			data:data
		}).done(function(msg){
				if (msg.result == "success") {

				} else if (msg.result == "failure") {

				}else{

				}
			}).fail(function(msg){
				console.info(msg)
			})
	}
	ModifyPassword.prototype.isNull = function(obj){
		if(obj.val().length == 0){
			obj.focus()
				.parent()
				.addClass('has-error')
				.end()
				.next('.help-block')
				.show();
			return true;
		}
		return false;
	}
	ModifyPassword.DEFAULTS.TEMPLATE = '<div class="modal fade" id="modifyPwd">' +
		'<div class="modal-dialog modify-pwd">' +
		'<div class="modal-content">' +
		'<div class="modal-header">' +
		'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
		'<h4 class="modal-title">修改密码</h4>' +
		'</div>' +
		'<div class="modal-body"> ' +
		'<form class="form-horizontal" role="form">' +
		'<div class="form-group">' +
		'<label for="oldPassword" class="col-lg-3 control-label">原始密码:</label>' +
		'<div class="col-lg-9">' +
		'<input type="password" class="form-control" id="oldPassword" >' +
		'<label class="help-block">原始密码不能为空!</label>' +
		'</div> ' +
		'</div>  ' +
		'<div class="form-group">' +
		'<label for="newPassword" class="col-lg-3 control-label">新密码:</label>' +
		'<div class="col-lg-9">' +
		'<input type="password" class="form-control" id="newPassword">' +
		'<label class="help-block">新密码不能为空!</label>' +
		'</div> ' +
		'</div> ' +
		'<div class="form-group"> ' +
		'<label for="confirmPassword" class="col-lg-3 control-label">确认密码:</label>' +
		'<div class="col-lg-9">' +
		'<input type="password" class="form-control" id="confirmPassword"> ' +
		'<label class="help-block">确认密码不能为空!</label>' +
		'</div>' +
		'</div>' +
		'</form>' +
		'</div>' +
		'<div class="modal-footer"> ' +
		'<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>' +
		'<button type="button" class="btn btn-primary" data-toggle="save">保存</button>' +
		'</div>' +
		'</div>  ' +
		'</div>  ' +
		'</div>';
	var old = $.fn.modifyPassword ;
	$.fn.modifyPassword  = function(option){
		return this.each(function(){
			var $this = $(this);
			var data = $this.data('koala.modifyPassowrd');
			var options = $.extend({}, ModifyPassword.DEFAULTS, $this.data(), typeof option == 'object' && option)
			if (data) {
				data.modal && data.modal.modal('show');
			} else {
				$this.data('koala.modifyPassowrd', (data = new ModifyPassword(this, options)));
			}
		})
	}
	$.fn.modifyPassword .Constructor = ModifyPassword;
	$.fn.modifyPassword .noConflict = function(){
		$.fn.modifyPassword  = old;
		return this;
	}
}(window.jQuery)

/*
*选择框组件
*/
+function($){

	"use strict" ;
	var Select = function(element, options){
		this.$element = $(element);
		this.options = options;
		this.$element.html(Select.DEFAULTS.TEMPLATE);
		this.$items = this.$element.find('.dropdown-menu')
		this.$item = this.$element.find('[data-toggle="item"]');
		this.$value = this.$element.find('[data-toggle="value"]');
		this.init();
	}
	Select.DEFAULTS = {

	}
	Select.prototype = {
		Constructor: Select,
		init: function(){
			var self = this;
			this.$item.html(self.options.title);
			var contents = self.options.contents;
			if(contents && contents.length){
				self.setItems(contents);
			}
			this.setDefaultSelection();
		},
		setItems: function(contents){
			var self = this;
			var items = new Array();
			for(var i = 0, j = contents.length; i < j; i++){
				var content =  contents[i];
				items.push('<li data-value="' + content.value + '"' + (content.selected && 'class="selected"') + '><a href="#">' + content.title + '</a></li>');
			}
			self.$items.html(items.join(' '));
			self.$items.find('li').on('click', function(e){
				e.preventDefault();
				self.clickItem($(this));
			});
			return self.$element;
		},
		clickItem: function($item){
			var that = this;
			var value = $item.data('value');
			if(!value || !this.$value.length || this.$value.val() == value){
				return this.$element;
			}
			//this.$items.find('li').removeClass('active');
			//$item.addClass('active');
			this.$item.html($item.find('a:first').html());
			this.$value.val(value);
			this.$element.trigger('change').popover('destroy').parent().removeClass('has-error');
			return  this.$element;
		},
		getValue: function(){
			return this.$value.val();
		},
		selectByValue: function(value){
			return this.selectBySelector('li[data-value="'+value+'"]');
		},
		selectByIndex: function(index){
			return this.selectBySelector('li:eq('+index+')');
		},
		selectBySelector: function(selector){
			return this.clickItem(this.$items.find(selector));
		},
		setDefaultSelection: function(){
			return this.selectBySelector('li.selected')
		}
	}
	Select.DEFAULTS.TEMPLATE = '<button type="button" class="btn btn-default" data-toggle="item">' +
		'</button><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
		'<span class="caret"></span>' +
		'<input type="hidden" data-toggle="value">' +
		'</button>' +
		'<ul class="dropdown-menu" role="menu"></ul>';
	$.fn.getValue = function(){
		return $(this).data('koala.select').getValue();
	};
	$.fn.setValue = function(value){
		return $(this).data('koala.select').selectByValue(value);
	}
	$.fn.setSelectItems = function(contents){
		return $(this).data('koala.select').setItems(contents);
	}
	var old = $.fn.select;
	$.fn.select = function(option){
		return this.each(function(){
			var $this = $(this);
			var data = $this.data('koala.select');
			var options = $.extend({}, Select.DEFAULTS, $this.data(), typeof option == 'object' && option);
			if(!data){
				$this.data('koala.select', (data = new Select(this, options)));
			}
			if(typeof option == 'string'){
				data[option]();
			}
		});
	}
	$.fn.select.Constructor = Select;
	$.fn.select.noConflict = function(){
		$.fn.select = old;
		return this;
	}
}(window.jQuery)

/*
*消息确认组件
*/
+function($){
	"use strict";
	var Confirm = function(container, options){
		this.container = $(container);
		this.$element = $(Confirm.DEFAULTS.TEMPLATE);
		this.options = options;
		this.init();
	}
	Confirm.DEFAULTS = {

	}
	Confirm.prototype.init = function(){
		var that = this;
		this.$element.modal({
			keyboard: false
		})
			.find('.modal-dialog')
			.css({'padding-top': window.screen.height/5})
			.find('[data-role="confirm-content"]').html(this.options.content);
		this.$element.find('[data-role="confirmBtn"]').on('click', function(){
			if(typeof that.options.callBack == 'function'){
				that.options.callBack();
				that.$element.modal('hide');
			}
		})
	}
	Confirm.DEFAULTS.TEMPLATE = '<div class="modal fade"  aria-hidden="false"><div class="modal-dialog" style=" width: 400px;"><div class="modal-content"><div class="modal-header"><button aria-hidden="true" data-dismiss="modal" class="close" type="button">×</button><h4 class="modal-title">确认</h4></div><div class="modal-body" style=" padding: 10px 40px;font-size: 16px;color: #c09853;"><span class="glyphicon glyphicon-warning-sign"></span>&nbsp;&nbsp;&nbsp;<span data-role="confirm-content">确定要删除吗?</span></div><div class="modal-footer"><button data-dismiss="modal" class="btn btn-default" type="button">取消</button><button data-role="confirmBtn" class="btn btn-danger" type="button">确定</button></div></div></div></div>';
	var old = $.fn.confirm;
	$.fn.confirm = function(option){
		return this.each(function(){
			var $this = $(this);
			var data = $this.data('koala.confirm');
			var options = $.extend({}, Confirm.DEFAULTS, $this.data(), typeof option == 'object' && option);
			$this.data('koala.confirm',(data = new Confirm (this, options)));
			if(typeof option == 'string'){
				data[option]();
			}
		})
	}
	$.fn.confirm.Constructor = Confirm;
	$.fn.confirm.noConflict = function(){
		$.fn.confirm = old;
		return this;
	}
}(window.jQuery)

