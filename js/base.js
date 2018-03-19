;(function(){
	'use strict';
   $(function(){
	var $form_add_task = $('.add-task')
	,$delete_task_trigger
	,$detail_task_trigger
	,$task_detail = $('.task-detail')
	,$task_detail_mask = $('.task-detail-mask')
	,task_list=[]
	,current_index
	,$update_form
	,$task_detail_content
	,$task_detail_content_input
	,$checkbox_complete
	,$msg=$('.msg')
	,$msg_content = $msg.find('.msg-content')
	,$msg_confirm = $msg.find('.confirmed');
	
    init();
	
	$form_add_task.on('submit',on_add_task_form_submit);
	$task_detail_mask.on('click',hide_task_detail);

	function listen_msg_event(){
        $msg_confirm.on('click',function(){
        	hide_msg();
        })
	}

    function on_add_task_form_submit(e){
    	var new_task={}, $input;
		// 禁用默认行为
		e.preventDefault();
		// 获取新task的值
		$input=$(this).find('input[name=content]');
		new_task.content=$input.val();
		// 如果新task的值为空 则直接返回 否则继续执行
		if(!new_task.content) return;
		// 存入新task
		if(add_task(new_task)){
           
            $input.val(null);    
	}
    }
    

    // 查找并监听所有删除按钮的点击事件
	function listen_task_delete(){
		$delete_task_trigger.on('click',function(){
    	var $this = $(this);
    	// 找到删除按钮所在的task元素
    	var $item=$this.parent().parent();
    	var index=$item.data('index');
    	
    	var tmp=confirm('确定删除？');
    	tmp ? delete_task(index) : null;
    })
	}

    // 监听打开task详情的事件
	function listen_task_detail(){
        var index;
        $('.task-item').on('dblclick',function(){
        	index = $(this).data('index');
        	show_task_detail(index);
        })

		$detail_task_trigger.on('click',function(){
			var $this=$(this);
			var $item=$this.parent().parent();
			    index=$item.data('index');
			show_task_detail(index);
		})
	}


	function listen_checkbox_complete(){
        $checkbox_complete.on('click',function(){
        	var $this = $(this);
        	var index =$this.parent().parent().data('index');
        	var item = get(index);
        	if (item.complete)
              update_task(index, {complete: false});
            else
              update_task(index, {complete: true});
        })
	}


	function get(index){
		return store.get('task_list')[index];
	}

    
	function show_task_detail(index){
		// 生成详情模板
		render_task_detail(index);
		current_index = index;
		// 显示详情模板
		$task_detail.show();
		// 显示详情模板mask
		$task_detail_mask.show();
	}


    // 更新task
	function update_task(index,data){
		if(!index || !task_list[index])
			return;

		task_list[index] = $.extend({}, task_list[index], data);
		refresh_task_list();
	}

    // 隐藏task详情
	function hide_task_detail(){
		$task_detail.hide();
		$task_detail_mask.hide();
	}
    

    function render_task_detail(index){
    	if(index===undefined || !task_list[index])
    		return;

    	var item = task_list[index];

    	var tpl='<form>' +
			'<div class="content">' +
			item.content +
			'</div>' +
			'<div class="input_item">' +
			'<input style="display:none; background-color:#ddd;" type="text" name="content" value="' + (item.content || '') + '">' +
			'</div>' +
			'<div>' +
			'<div class="desc input_item">' +
			'<textarea name="desc">'  + (item.desc || '') + '</textarea>' +
			'</div>' +
			'</div>' +
			'<div class="remind input_item">' +
			'<label>提醒时间</label>' +
			'<input style="background-color:#ddd;" class="datetime" name="remind_date" type="text" value="' + (item.remind_date || '') + '">' +
			'</div>' +
			'<div><button type="submit">更新</button></div>' +
		    '</form>' ;
            // 清空task详情模板，用新模板替换
		    $task_detail.html(null);
		    $task_detail.html(tpl);
		    $('.datetime').datetimepicker();
		    // 选中其中的form元素，因为之后会使用其监听submit事件
		    $update_form = $task_detail.find('form');
            $task_detail_content = $update_form.find('.content');
             $task_detail_content_input = $update_form.find('input[name=content]');
             
             // 双击内容元素显示input，隐藏自己
             $task_detail_content.on('dblclick', function(){
             $task_detail_content_input.show();
            $task_detail_content.hide();

             })

            $update_form.on('submit',function(e){
            	e.preventDefault();
                var data = {};
                // 获取表单中各个input的值
                data.content=$(this).find('[name=content]').val();
                data.desc=$(this).find('[name=desc]').val();
                data.remind_date=$(this).find('[name=remind_date]').val();
                
            	update_task(index,data);
            	hide_task_detail();
            })
    }

	function add_task(new_task){
		// 将新task推入task_list
        task_list.push(new_task);
        // 更新localStorage
        refresh_task_list();
        return true;
	}
       // 刷新localstorage数据并渲染模板
	function refresh_task_list(){
        store.set('task_list',task_list);
        render_task_list();
	}
    // 删除一条task
    function delete_task(index){
    	if(index===undefined||!task_list[index]) return;
    	delete task_list[index];
    	// 更新localStorage
    	refresh_task_list();
    }

      function init(){
      	task_list = store.get('task_list')||[];
      	listen_msg_event();
      	if(task_list.length)
      		render_task_list();
      	    task_remind_check();
      }
     
      function task_remind_check(){
      
      	var current_time;
      	var itl = setInterval(function(){
      		for(var i=0; i<task_list.length; i++){
      		var item = get(i), task_time;
      		if(!item || !item.remind_date || item.informed )
      			continue;

      		current_time=(new Date()).getTime();
      		task_time=(new Date(item.remind_date)).getTime();
      		if(current_time - task_time >=1){
      			update_task(i, {informed: true});
      			show_msg(item.content);
      		}
      	}

      	},500);
      	
      }


      function show_msg(msg){
      	if(!msg) return;
          $msg_content.html(msg);
          $msg.show();
      }


      function hide_msg(){
          $msg.hide();
      }



     // 渲染所有的task模板
      function render_task_list(){
      	var $task_list = $('.task-list');
      	$task_list.html('');
      	var complete_items=[];
      	for(var i=0;i <task_list.length;i++){
      		var item = task_list[i];
      		if (item && item.complete)
      			complete_items[i] = item;

      		else
                var $task = render_task_item(item,i);
            $task_list.prepend($task);
      	}
         
        
 
        for(var j=0; j<complete_items.length; j++){
            $task = render_task_item(complete_items[j], j);
            // console.log($task);
            if(!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }

      	$delete_task_trigger= $('.action.delete');
        $detail_task_trigger= $('.action.detail');
        $checkbox_complete=$('.task-list .complete[type=checkbox]');
      	listen_task_delete();
      	listen_task_detail();
      	listen_checkbox_complete();
      }

      
      // 渲染单条task模板
      function render_task_item(data,index){
      	if(!data||!index) return;
      	var list_item_tpl=
      	'<div class="task-item" data-index="' + index + '">' +
		'<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
		'<span class="task-content">'+data.content+'</span>' +
		'<span class="fr">' +
		'<span class="action delete"> 删除</span>' +
		'<span class="action detail"> 详细</span>' +
		'</span>' +
		'</div>';
		return $(list_item_tpl);
      }
    })
    
})();