<%@ page language="java" contentType="text/html; charset=UTF-8"  pageEncoding="UTF-8"%>
<div class="modal fade menu">
     <style>
        .menu .form-control {
            width: 95%;
        }
       .modal-footer{
       padding:10px 20px;
       }
    </style>
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title">添加菜单资源</h4>
            </div>
            <div class="modal-body" style="padding-left:45px; padding-right:65px; height: 350px;">
                <form class="form-horizontal menu_form">
                    <div class="form-group parentName">
                        <label class="col-lg-3 control-label">父菜单名称:</label>
                        <div class="col-lg-9">
                            <input type="text" class="form-control" name = "parentId" disabled>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-lg-3 control-label" for="id">菜单资源名称:</label>
                        <div class="col-lg-9">
                            <input type="text" class="form-control" name="name"><span class="required">*</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-lg-3 control-label" for="identifier">菜单资源标识:</label>
                        <div class="col-lg-9">
                            <input type="text" class="form-control" name="identifier"><span class="required">*</span>
                        </div>
                    </div>
                     <div class="form-group">
                        <label class="col-lg-3 control-label" for="url">菜单资源url:</label>
                        <div class="col-lg-9">
                            <input type="text" class="form-control" name="url"/>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-lg-3 control-label">菜单资源图片:</label>
                        <div class="col-lg-9">
                            <span id="menuIcon" class="menu-icon"></span>
                            <input type="hidden" name="icon"/>
                            <button id="iconBtn" type="button" class="btn btn-info">浏览图片</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-lg-3 control-label">菜单资源描述:</label>
                        <div class="col-lg-9">
                            <input type="text" class="form-control" id = "description" name="description"/>
                        </div>
                    </div>
		            <div class="modal-footer">
		                <button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
		                <button type="button" class="btn btn-success save">保存</button>
		            </div>
                </form>
            </div>
        </div>
    </div>
</div>